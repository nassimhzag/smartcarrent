import { useMemo, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import useAdminMarques from '../hooks/useAdminMarques';
import useToast from '../hooks/useToast';
import { ToastStack } from '../components/Toast';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { IconEdit, IconTrash } from '../components/AdminIcons';
import { getApiErrorMessage } from '../api/errorUtils';

const EMPTY_FORM = {
  nom: '',
  pays: '',
};

export default function AdminMarques() {
  const { marques, loading, error, addMarque, editMarque, removeMarque } = useAdminMarques();
  const { toasts, success, error: toastError, dismiss } = useToast();

  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [marqueToDelete, setMarqueToDelete] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const filteredMarques = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q === '') return marques;
    return marques.filter(
      (m) =>
        String(m.nom || '').toLowerCase().includes(q) ||
        String(m.pays || '').toLowerCase().includes(q)
    );
  }, [marques, search]);

  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEditModal(marque) {
    setEditingId(marque.id);
    setForm({
      nom: marque.nom || '',
      pays: marque.pays || '',
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
        nom: form.nom.trim(),
        pays: form.pays.trim() || null,
      };

      if (editingId) {
        await editMarque(editingId, payload);
      } else {
        await addMarque(payload);
      }
      closeModal();
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError, "Echec de l'enregistrement de la marque."));
    } finally {
      setSubmitting(false);
    }
  }

  function askDelete(marque, event) {
    if (event) event.stopPropagation();
    setMarqueToDelete(marque);
  }

  function cancelDelete() {
    if (deleteBusy) return;
    setMarqueToDelete(null);
  }

  async function confirmDelete() {
    if (!marqueToDelete) return;
    const target = marqueToDelete;
    setDeleteBusy(true);
    try {
      await removeMarque(target.id);
      success(`Marque "${target.nom}" supprimee.`);
      setMarqueToDelete(null);
    } catch (requestError) {
      toastError(getApiErrorMessage(requestError, 'Impossible de supprimer la marque.'));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <AdminLayout title="Gestion des marques" subtitle="Marques de voitures du catalogue">
      <section className="admin-toolbar">
        <div className="admin-toolbar-filters">
          <input
            className="admin-input"
            type="search"
            placeholder="Rechercher une marque ou un pays..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button type="button" className="admin-primary-btn" onClick={openCreateModal}>
          + Ajouter une marque
        </button>
      </section>

      {error && <p className="error-box">{error}</p>}

      <section className="admin-panel admin-table-panel">
        {loading ? (
          <p className="muted-row" style={{ padding: 14 }}>
            Chargement des marques...
          </p>
        ) : filteredMarques.length === 0 ? (
          <p className="muted-row" style={{ padding: 14 }}>
            Aucune marque trouvee.
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Marque</th>
                  <th>Pays</th>
                  <th>Voitures associees</th>
                  <th className="admin-table-actions-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMarques.map((m) => {
                  const carCount = m.voitures?.length || 0;
                  return (
                    <tr key={m.id}>
                      <td>
                        <strong>{m.nom}</strong>
                      </td>
                      <td>{m.pays || <span className="muted-row">—</span>}</td>
                      <td>
                        <span className={carCount > 0 ? 'badge badge-ok' : 'badge badge-muted'}>
                          {carCount} voiture{carCount > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-icon-btn admin-icon-edit"
                            onClick={() => openEditModal(m)}
                            aria-label="Modifier la marque"
                            title="Modifier"
                          >
                            <IconEdit />
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn admin-icon-danger"
                            onClick={(event) => askDelete(m, event)}
                            aria-label="Supprimer la marque"
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
              <h3>{editingId ? 'Modifier la marque' : 'Ajouter une marque'}</h3>
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
                  <span>Nom de la marque</span>
                  <input
                    type="text"
                    required
                    value={form.nom}
                    onChange={(event) => updateField('nom', event.target.value)}
                    placeholder="Ex. Renault"
                  />
                </label>

                <label className="admin-form-field">
                  <span>Pays d'origine</span>
                  <input
                    type="text"
                    value={form.pays}
                    onChange={(event) => updateField('pays', event.target.value)}
                    placeholder="Ex. France"
                  />
                </label>
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
                    : 'Creer la marque'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(marqueToDelete)}
        title="Etes-vous sur de vouloir supprimer cette marque ?"
        message={
          marqueToDelete
            ? (marqueToDelete.voitures?.length || 0) > 0
              ? `La marque "${marqueToDelete.nom}" est associee a ${marqueToDelete.voitures.length} voiture(s). La supprimer pourrait poser probleme. Cette action est irreversible.`
              : `La marque "${marqueToDelete.nom}" sera supprimee definitivement. Cette action est irreversible.`
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
