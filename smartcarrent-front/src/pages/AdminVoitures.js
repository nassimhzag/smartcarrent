import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import useAdminVoitures from '../hooks/useAdminVoitures';
import useToast from '../hooks/useToast';
import { ToastStack } from '../components/Toast';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { IconEdit, IconTrash } from '../components/AdminIcons';
import { listMarques } from '../services/marqueService';
import { getApiErrorMessage } from '../api/errorUtils';

// Statuts manuels admin : seuls 'disponible' et 'maintenance' sont positionnables.
// Le statut 'reservee' est calcule dynamiquement par l'accessor effective_statut
// du modele Voiture (a partir des reservations en cours) et ne doit JAMAIS
// etre choisi manuellement par l'admin.
const STATUTS = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'maintenance', label: 'Maintenance' },
];

// Libelle a afficher pour le statut effectif (calcule). Inclut 'reservee'
// uniquement pour l'affichage dans le tableau, jamais dans le formulaire.
function statusEffectiveLabel(statut) {
  if (statut === 'disponible') return 'Disponible';
  if (statut === 'maintenance') return 'Maintenance';
  if (statut === 'reservee') return 'Reservee';
  return statut || '—';
}

const CATEGORIES = ['SUV', 'Berline', 'Citadine', 'Luxe', 'Utilitaire'];

const EMPTY_FORM = {
  marque_id: '',
  immatriculation: '',
  modele: '',
  annee: new Date().getFullYear(),
  prix_par_jour: '',
  statut: 'disponible',
  categorie: '',
  image: null,
  remove_image: false,
};

function statusBadgeClass(statut) {
  if (statut === 'disponible') return 'badge badge-ok';
  if (statut === 'reservee') return 'badge badge-warn';
  if (statut === 'maintenance') return 'badge badge-muted';
  return 'badge';
}

// Pour le tableau, on utilise le statut effectif (incluant 'reservee'),
// pas seulement la liste des statuts manuels.
function statusLabel(statut) {
  return statusEffectiveLabel(statut);
}

function formatPrice(price) {
  const n = Number(price);
  if (Number.isNaN(n)) return '—';
  return `${n.toFixed(2)} DT/j`;
}

export default function AdminVoitures() {
  const { voitures, loading, error, addVoiture, editVoiture, removeVoiture } = useAdminVoitures();
  const { toasts, success, error: toastError, dismiss } = useToast();

  const [marques, setMarques] = useState([]);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  const [voitureToDelete, setVoitureToDelete] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadMarques() {
      try {
        const response = await listMarques();
        if (!cancelled) {
          setMarques(response?.data || []);
        }
      } catch (e) {
        // Pas bloquant — l'utilisateur peut quand même créer une voiture sans marque
      }
    }
    loadMarques();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredVoitures = useMemo(() => {
    const q = search.trim().toLowerCase();
    return voitures.filter((v) => {
      const matchesQuery =
        q === '' ||
        String(v.modele || '').toLowerCase().includes(q) ||
        String(v.immatriculation || '').toLowerCase().includes(q) ||
        String(v.marque?.nom || '').toLowerCase().includes(q);
      return matchesQuery;
    });
  }, [voitures, search]);

  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImagePreview(null);
    setFormError('');
    setModalOpen(true);
  }

  function openEditModal(voiture) {
    setEditingId(voiture.id);
    setForm({
      marque_id: voiture.marque_id || '',
      immatriculation: voiture.immatriculation || '',
      modele: voiture.modele || '',
      annee: voiture.annee || new Date().getFullYear(),
      prix_par_jour: voiture.prix_par_jour || '',
      statut: voiture.statut || 'disponible',
      categorie: voiture.categorie || '',
      image: null,
      remove_image: false,
    });
    setImagePreview(voiture.image_url || null);
    setFormError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImagePreview(null);
    setFormError('');
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, image: file, remove_image: false }));
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  }

  function handleRemoveImage() {
    setForm((prev) => ({ ...prev, image: null, remove_image: true }));
    setImagePreview(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      if (editingId) {
        await editVoiture(editingId, form);
      } else {
        await addVoiture(form);
      }
      closeModal();
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError, 'Echec de l\'enregistrement de la voiture.'));
    } finally {
      setSubmitting(false);
    }
  }

  function askDelete(voiture, event) {
    if (event) event.stopPropagation();
    setVoitureToDelete(voiture);
  }

  function cancelDelete() {
    if (deleteBusy) return;
    setVoitureToDelete(null);
  }

  async function confirmDelete() {
    if (!voitureToDelete) return;
    const target = voitureToDelete;
    setDeleteBusy(true);
    try {
      await removeVoiture(target.id);
      success(`Voiture "${target.modele}" supprimee.`);
      setVoitureToDelete(null);
    } catch (requestError) {
      toastError(getApiErrorMessage(requestError, 'Impossible de supprimer la voiture.'));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <AdminLayout title="Gestion des voitures" subtitle="Catalogue, prix, disponibilite & images">
      <section className="admin-toolbar">
        <div className="admin-toolbar-filters">
          <input
            className="admin-input"
            type="search"
            placeholder="Rechercher par modele, immatriculation, marque..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button type="button" className="admin-primary-btn" onClick={openCreateModal}>
          + Ajouter une voiture
        </button>
      </section>

      {error && <p className="error-box">{error}</p>}

      <section className="admin-panel admin-table-panel">
        {loading ? (
          <p className="muted-row" style={{ padding: 14 }}>
            Chargement des voitures...
          </p>
        ) : filteredVoitures.length === 0 ? (
          <p className="muted-row" style={{ padding: 14 }}>
            Aucune voiture trouvee.
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Marque / Modele</th>
                  <th>Immatriculation</th>
                  <th>Annee</th>
                  <th>Prix</th>
                  <th>Statut</th>
                  <th className="admin-table-actions-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVoitures.map((v) => {
                  const currentStatut = v.effective_statut || v.statut;
                  return (
                    <tr
                      key={v.id}
                      className="admin-table-row-clickable"
                      onClick={() => openEditModal(v)}
                      title="Cliquer pour modifier"
                    >
                      <td>
                        {v.image_url ? (
                          <img src={v.image_url} alt={v.modele} className="admin-thumb" />
                        ) : (
                          <div className="admin-thumb admin-thumb-empty">—</div>
                        )}
                      </td>
                      <td>
                        <strong>{v.marque?.nom || 'Sans marque'}</strong>
                        <div className="muted-row admin-modele-row">
                          <span>{v.modele}</span>
                          {v.categorie && (
                            <span className="admin-cat-chip">{v.categorie}</span>
                          )}
                        </div>
                      </td>
                      <td>{v.immatriculation}</td>
                      <td>{v.annee}</td>
                      <td>{formatPrice(v.prix_par_jour)}</td>
                      <td>
                        <span className={statusBadgeClass(currentStatut)}>
                          {statusLabel(currentStatut)}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-icon-btn admin-icon-edit"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditModal(v);
                            }}
                            aria-label="Modifier la voiture"
                            title="Modifier"
                          >
                            <IconEdit />
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn admin-icon-danger"
                            onClick={(event) => askDelete(v, event)}
                            aria-label="Supprimer la voiture"
                            title="Supprimer"
                          >
                            <IconTrash />
                          </button>
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
              <h3>{editingId ? 'Modifier la voiture' : 'Ajouter une voiture'}</h3>
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
              <div className="admin-form-grid">
                <label className="admin-form-field">
                  <span>Marque</span>
                  <select
                    value={form.marque_id}
                    onChange={(event) => updateField('marque_id', event.target.value)}
                  >
                    <option value="">— Aucune —</option>
                    {marques.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nom}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Champ Statut : visible uniquement en edition. A la creation, le
                    statut est force a 'disponible' cote backend. */}
                {editingId && (
                  <label className="admin-form-field">
                    <span>Statut</span>
                    <select
                      value={form.statut}
                      onChange={(event) => updateField('statut', event.target.value)}
                    >
                      {STATUTS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="admin-form-field">
                  <span>Categorie</span>
                  <select
                    value={form.categorie}
                    onChange={(event) => updateField('categorie', event.target.value)}
                  >
                    <option value="">— Aucune —</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-form-field">
                  <span>Modele</span>
                  <input
                    type="text"
                    required
                    value={form.modele}
                    onChange={(event) => updateField('modele', event.target.value)}
                    placeholder="Ex. Clio 5"
                  />
                </label>

                <label className="admin-form-field">
                  <span>Immatriculation</span>
                  <input
                    type="text"
                    required
                    value={form.immatriculation}
                    onChange={(event) => updateField('immatriculation', event.target.value)}
                    placeholder="Ex. 123 TUN 4567"
                  />
                </label>

                <label className="admin-form-field">
                  <span>Annee</span>
                  <input
                    type="number"
                    required
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={form.annee}
                    onChange={(event) => updateField('annee', event.target.value)}
                  />
                </label>

                <label className="admin-form-field">
                  <span>Prix par jour (DT)</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.prix_par_jour}
                    onChange={(event) => updateField('prix_par_jour', event.target.value)}
                    placeholder="Ex. 80"
                  />
                </label>
              </div>

              <div className="admin-form-image">
                <span className="admin-form-image-label">Image de la voiture</span>
                <div className="admin-form-image-row">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Apercu voiture" className="admin-form-preview" />
                  ) : (
                    <div className="admin-form-preview admin-form-preview-empty">
                      <span>Pas d'image</span>
                    </div>
                  )}
                  <div className="admin-form-image-actions">
                    <label className="admin-secondary-btn">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                      Choisir une image
                    </label>
                    {imagePreview && (
                      <button
                        type="button"
                        className="admin-link-btn admin-link-danger"
                        onClick={handleRemoveImage}
                      >
                        Retirer l'image
                      </button>
                    )}
                  </div>
                </div>
              </div>

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
                    : 'Creer la voiture'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(voitureToDelete)}
        title="Etes-vous sur de vouloir supprimer cette voiture ?"
        message={
          voitureToDelete
            ? `La voiture "${voitureToDelete.modele}" (${voitureToDelete.immatriculation}) sera supprimee definitivement. Cette action est irreversible.`
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
