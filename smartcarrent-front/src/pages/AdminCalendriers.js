import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';
import useAdminCalendriers from '../hooks/useAdminCalendriers';
import useToast from '../hooks/useToast';
import { ToastStack } from '../components/Toast';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { IconEdit, IconTrash } from '../components/AdminIcons';
import { listVoitures } from '../services/voitureService';
import { ROUTES } from '../routes/paths';
import { getApiErrorMessage } from '../api/errorUtils';

const EMPTY_FORM = {
  voiture_id: '',
  date_debut: '',
  date_fin: '',
  disponible: false,
};

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (error) {
    return String(value);
  }
}

function diffInDays(start, end) {
  if (!start || !end) return 0;
  const a = new Date(start);
  const b = new Date(end);
  const diff = Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff + 1, 1);
}

function statusBadgeClass(status) {
  if (status === 'disponible') return 'badge badge-ok';
  if (status === 'en_attente_paiement') return 'badge badge-warn';
  if (status === 'reservee') return 'badge badge-info';
  if (status === 'indisponible') return 'badge badge-danger';
  return 'badge';
}

function statusLabel(status) {
  if (status === 'disponible') return 'Disponible';
  if (status === 'en_attente_paiement') return 'En attente paiement';
  if (status === 'reservee') return 'Reservee';
  if (status === 'indisponible') return 'Indisponible';
  return status;
}

function describeVoiture(voiture) {
  if (!voiture) return 'Vehicule inconnu';
  return voiture.modele || '—';
}

export default function AdminCalendriers() {
  const { entries, loading, error, addCalendrier, editCalendrier, removeCalendrier, reload } =
    useAdminCalendriers();
  const { toasts, success, error: toastError, dismiss } = useToast();

  const [voitures, setVoitures] = useState([]);
  const [voitureFilter, setVoitureFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadVoitures() {
      try {
        const response = await listVoitures({ per_page: 100 });
        if (!cancelled) {
          setVoitures(response?.data || []);
        }
      } catch (e) {
        // Pas bloquant
      }
    }
    loadVoitures();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesVoiture =
        voitureFilter === 'all' || String(entry.voiture_id) === String(voitureFilter);
      const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
      return matchesVoiture && matchesStatus;
    });
  }, [entries, voitureFilter, statusFilter]);

  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEditModal(entry) {
    if (entry.source !== 'manual') return;
    const calendrier = entry.raw;
    setEditingId(calendrier.id);
    setForm({
      voiture_id: String(calendrier.voiture_id || ''),
      date_debut: calendrier.date_debut ? String(calendrier.date_debut).slice(0, 10) : '',
      date_fin: calendrier.date_fin ? String(calendrier.date_fin).slice(0, 10) : '',
      disponible: Boolean(calendrier.disponible),
    });
    setFormError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const payload = {
        voiture_id: Number(form.voiture_id),
        date_debut: form.date_debut,
        date_fin: form.date_fin,
        disponible: Boolean(form.disponible),
      };

      if (editingId) {
        await editCalendrier(editingId, payload);
        success('Plage calendrier mise a jour.');
      } else {
        await addCalendrier(payload);
        success('Plage calendrier creee.');
      }
      closeModal();
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError, "Echec de l'enregistrement."));
    } finally {
      setSubmitting(false);
    }
  }

  function askDelete(entry, event) {
    if (event) event.stopPropagation();
    if (entry.source !== 'manual') return;
    setEntryToDelete(entry);
  }

  function cancelDelete() {
    if (deleteBusy) return;
    setEntryToDelete(null);
  }

  async function confirmDelete() {
    if (!entryToDelete) return;
    const target = entryToDelete;
    setDeleteBusy(true);
    try {
      await removeCalendrier(target.sourceId);
      success('Plage calendrier supprimee.');
      setEntryToDelete(null);
    } catch (requestError) {
      toastError(getApiErrorMessage(requestError, 'Impossible de supprimer la plage.'));
    } finally {
      setDeleteBusy(false);
    }
  }

  async function handleRefresh() {
    try {
      await reload();
      success('Calendrier actualise.');
    } catch (requestError) {
      toastError(getApiErrorMessage(requestError, "Echec de l'actualisation."));
    }
  }

  return (
    <AdminLayout
      title="Gestion du calendrier"
      subtitle="Disponibilites reelles : plages admin + reservations actives"
    >
      <section className="admin-toolbar">
        <div className="admin-toolbar-filters">
          <select
            className="admin-input"
            value={voitureFilter}
            onChange={(event) => setVoitureFilter(event.target.value)}
          >
            <option value="all">Toutes les voitures</option>
            {voitures.map((v) => (
              <option key={v.id} value={v.id}>
                {describeVoiture(v)} · {v.immatriculation}
              </option>
            ))}
          </select>
          <select
            className="admin-input"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="disponible">Disponible</option>
            <option value="en_attente_paiement">En attente paiement</option>
            <option value="reservee">Reservee</option>
            <option value="indisponible">Indisponible</option>
          </select>
        </div>
        <div className="admin-toolbar-actions">
          <button type="button" className="admin-secondary-btn" onClick={handleRefresh}>
            ↻ Actualiser
          </button>
          <button type="button" className="admin-primary-btn" onClick={openCreateModal}>
            + Ajouter une plage
          </button>
        </div>
      </section>

      {error && <p className="error-box">{error}</p>}

      <section className="admin-panel admin-table-panel">
        {loading ? (
          <div className="admin-loading-row">
            <span className="admin-spinner" aria-hidden="true" />
            <span>Chargement des disponibilites...</span>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon" aria-hidden="true">📅</div>
            <p>
              <strong>Aucune entree trouvee.</strong>
            </p>
            <p className="muted-row">
              Toutes les voitures sont libres pour les filtres selectionnes.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Vehicule</th>
                  <th>Date debut</th>
                  <th>Date fin</th>
                  <th>Duree</th>
                  <th>Source</th>
                  <th>Statut</th>
                  <th className="admin-table-actions-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => {
                  const days = diffInDays(entry.date_debut, entry.date_fin);
                  const isManual = entry.source === 'manual';
                  return (
                    <tr
                      key={entry.id}
                      className={isManual ? 'admin-table-row-clickable' : ''}
                      onClick={isManual ? () => openEditModal(entry) : undefined}
                      title={isManual ? 'Cliquer pour modifier la plage' : undefined}
                    >
                      <td>
                        <strong>{describeVoiture(entry.voiture)}</strong>
                        <div className="muted-row">{entry.voiture?.immatriculation || '—'}</div>
                      </td>
                      <td>{formatDate(entry.date_debut)}</td>
                      <td>{formatDate(entry.date_fin)}</td>
                      <td>
                        {days} jour{days > 1 ? 's' : ''}
                      </td>
                      <td>
                        {isManual ? (
                          <span className="badge badge-source-manual">Manuel admin</span>
                        ) : (
                          <span className="badge badge-source-reservation">
                            Reservation #{entry.sourceId}
                          </span>
                        )}
                        {!isManual && entry.client?.utilisateur && (
                          <div className="muted-row" style={{ fontSize: '0.78rem', marginTop: 4 }}>
                            {entry.client.utilisateur.name}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={statusBadgeClass(entry.status)}>
                          {statusLabel(entry.status)}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          {isManual ? (
                            <>
                              <button
                                type="button"
                                className="admin-icon-btn admin-icon-edit"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openEditModal(entry);
                                }}
                                aria-label="Modifier la plage"
                                title="Modifier"
                              >
                                <IconEdit />
                              </button>
                              <button
                                type="button"
                                className="admin-icon-btn admin-icon-danger"
                                onClick={(event) => askDelete(entry, event)}
                                aria-label="Supprimer la plage"
                                title="Supprimer"
                              >
                                <IconTrash />
                              </button>
                            </>
                          ) : (
                            <Link
                              to={ROUTES.ADMIN_RESERVATIONS}
                              className="admin-link-btn"
                            >
                              Voir reservation
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
        >
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <header className="admin-modal-head">
              <h3>{editingId ? 'Modifier la plage' : 'Ajouter une plage manuelle'}</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={closeModal}
                aria-label="Fermer"
              >
                ×
              </button>
            </header>

            <form onSubmit={handleSubmit} className="admin-form" noValidate>
              <label className="admin-form-field" style={{ display: 'grid', gap: 6 }}>
                <span>Vehicule</span>
                <select
                  required
                  value={form.voiture_id}
                  onChange={(event) => updateField('voiture_id', event.target.value)}
                >
                  <option value="">— Choisir une voiture —</option>
                  {voitures.map((v) => (
                    <option key={v.id} value={v.id}>
                      {describeVoiture(v)} · {v.immatriculation}
                    </option>
                  ))}
                </select>
              </label>

              <div className="admin-form-grid">
                <label className="admin-form-field">
                  <span>Date debut</span>
                  <input
                    type="date"
                    required
                    value={form.date_debut}
                    onChange={(event) => updateField('date_debut', event.target.value)}
                  />
                </label>

                <label className="admin-form-field">
                  <span>Date fin</span>
                  <input
                    type="date"
                    required
                    value={form.date_fin}
                    onChange={(event) => updateField('date_fin', event.target.value)}
                  />
                </label>
              </div>

              <label className="admin-toggle-field">
                <input
                  type="checkbox"
                  checked={form.disponible}
                  onChange={(event) => updateField('disponible', event.target.checked)}
                />
                <div>
                  <strong>{form.disponible ? 'Plage disponible' : 'Plage bloquee'}</strong>
                  <span className="muted-row">
                    {form.disponible
                      ? 'La voiture est marquee comme disponible sur cette periode.'
                      : 'La voiture sera bloquee : aucune nouvelle reservation possible.'}
                  </span>
                </div>
              </label>

              {formError && <p className="error-box">{formError}</p>}

              <footer className="admin-form-footer">
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button type="submit" className="admin-primary-btn" disabled={submitting}>
                  {submitting
                    ? 'Enregistrement...'
                    : editingId
                    ? 'Enregistrer les modifications'
                    : 'Creer la plage'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(entryToDelete)}
        title="Etes-vous sur de vouloir supprimer cette plage ?"
        message={
          entryToDelete
            ? `La plage manuelle du ${formatDate(entryToDelete.date_debut)} au ${formatDate(entryToDelete.date_fin)} pour "${describeVoiture(entryToDelete.voiture)}" sera supprimee. Cette action est irreversible.`
            : null
        }
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        busy={deleteBusy}
      />

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </AdminLayout>
  );
}
