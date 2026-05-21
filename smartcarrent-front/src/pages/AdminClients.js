import { useMemo, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import useAdminClients from '../hooks/useAdminClients';
import useToast from '../hooks/useToast';
import { ToastStack } from '../components/Toast';
import ClientDetailsModal from '../components/ClientDetailsModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { IconEdit, IconTrash } from '../components/AdminIcons';
import { getClientById } from '../services/clientService';
import { getApiErrorMessage } from '../api/errorUtils';

const EMPTY_FORM = {
  permis_conduire: '',
  telephone: '',
  adresse: '',
};

function getInitials(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
}

export default function AdminClients() {
  const { clients, loading, error, editClient, removeClient } = useAdminClients();
  const { toasts, success, error: toastError, dismiss } = useToast();

  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [detailsClient, setDetailsClient] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [clientToDelete, setClientToDelete] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q === '') return clients;
    return clients.filter((c) => {
      const name = String(c.utilisateur?.name || '').toLowerCase();
      const email = String(c.utilisateur?.email || '').toLowerCase();
      const tel = String(c.telephone || '').toLowerCase();
      const permis = String(c.permis_conduire || '').toLowerCase();
      const adresse = String(c.adresse || '').toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        tel.includes(q) ||
        permis.includes(q) ||
        adresse.includes(q)
      );
    });
  }, [clients, search]);

  function openEditModal(client) {
    setEditingClient(client);
    setForm({
      permis_conduire: client.permis_conduire || '',
      telephone: client.telephone || '',
      adresse: client.adresse || '',
    });
    setFormError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingClient(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!editingClient) return;

    setSubmitting(true);
    setFormError('');

    try {
      const payload = {
        permis_conduire: form.permis_conduire.trim(),
        adresse: form.adresse.trim(),
        telephone: form.telephone.trim() || null,
      };
      await editClient(editingClient.id, payload);
      success('Informations du client mises a jour.');
      closeModal();
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError, "Echec de l'enregistrement."));
    } finally {
      setSubmitting(false);
    }
  }

  async function openDetailsModal(client) {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsClient(null);
    try {
      const fullClient = await getClientById(client.id);
      setDetailsClient(fullClient);
    } catch (requestError) {
      toastError(getApiErrorMessage(requestError, 'Impossible de charger les details du client.'));
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeDetailsModal() {
    setDetailsOpen(false);
    setDetailsClient(null);
    setDetailsLoading(false);
  }

  function askDelete(client, event) {
    if (event) event.stopPropagation();
    setClientToDelete(client);
  }

  function cancelDelete() {
    if (deleteBusy) return;
    setClientToDelete(null);
  }

  async function confirmDelete() {
    if (!clientToDelete) return;
    const target = clientToDelete;
    const name = target.utilisateur?.name || 'ce client';
    setDeleteBusy(true);
    try {
      await removeClient(target.id);
      success(`Client "${name}" supprime avec succes.`);
      setClientToDelete(null);
    } catch (requestError) {
      toastError(getApiErrorMessage(requestError, 'Impossible de supprimer le client.'));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <AdminLayout
      title="Gestion des clients"
      subtitle="Profils clients et informations de contact"
    >
      <section className="admin-toolbar">
        <div className="admin-toolbar-filters">
          <input
            className="admin-input"
            type="search"
            placeholder="Rechercher par nom, email, telephone, permis, adresse..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <p className="muted-row" style={{ margin: 0, fontSize: '0.82rem' }}>
          Nouveau client : il s'enregistre via le formulaire d'inscription
        </p>
      </section>

      {error && <p className="error-box">{error}</p>}

      <section className="admin-panel admin-table-panel">
        {loading ? (
          <div className="admin-loading-row">
            <span className="admin-spinner" aria-hidden="true" />
            <span>Chargement des clients...</span>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon" aria-hidden="true">👥</div>
            <p>
              <strong>Aucun client trouve.</strong>
            </p>
            <p className="muted-row">
              {search
                ? 'Modifie ta recherche pour elargir les resultats.'
                : 'Les nouveaux clients apparaitront ici une fois inscrits.'}
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Email</th>
                  <th>Telephone</th>
                  <th>Permis</th>
                  <th>Adresse</th>
                  <th>Reservations</th>
                  <th className="admin-table-actions-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((c) => {
                  const isBusy = deleteBusy && clientToDelete?.id === c.id;
                  const name = c.utilisateur?.name || 'Sans nom';
                  return (
                    <tr
                      key={c.id}
                      className="admin-table-row-clickable"
                      onClick={() => openDetailsModal(c)}
                      title="Cliquer pour voir les details"
                    >
                      <td>
                        <div className="admin-client-cell">
                          <span className="admin-client-avatar">{getInitials(name)}</span>
                          <strong>{name}</strong>
                        </div>
                      </td>
                      <td>{c.utilisateur?.email || <span className="muted-row">—</span>}</td>
                      <td>{c.telephone || <span className="muted-row">—</span>}</td>
                      <td>{c.permis_conduire || <span className="muted-row">—</span>}</td>
                      <td title={c.adresse || ''} style={{ maxWidth: 220 }}>
                        <div className="admin-cell-truncate">
                          {c.adresse || <span className="muted-row">—</span>}
                        </div>
                      </td>
                      <td>
                        <span
                          className={
                            (c.reservations_count || 0) > 0
                              ? 'badge badge-ok'
                              : 'badge badge-muted'
                          }
                        >
                          {c.reservations_count || 0} resa
                          {(c.reservations_count || 0) > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-icon-btn admin-icon-edit"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditModal(c);
                            }}
                            disabled={isBusy}
                            aria-label="Modifier le client"
                            title="Modifier"
                          >
                            <IconEdit />
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn admin-icon-danger"
                            onClick={(event) => askDelete(c, event)}
                            disabled={isBusy}
                            aria-label="Supprimer le client"
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

      {modalOpen && editingClient && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
        >
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <header className="admin-modal-head">
              <div>
                <h3>Modifier le client</h3>
                <p className="muted-row" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                  {editingClient.utilisateur?.name} · {editingClient.utilisateur?.email}
                </p>
              </div>
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
                  <span>Permis de conduire</span>
                  <input
                    type="text"
                    required
                    value={form.permis_conduire}
                    onChange={(event) => updateField('permis_conduire', event.target.value)}
                    placeholder="N° du permis"
                  />
                </label>

                <label className="admin-form-field">
                  <span>Telephone</span>
                  <input
                    type="tel"
                    value={form.telephone}
                    onChange={(event) => updateField('telephone', event.target.value)}
                    placeholder="+216 ..."
                  />
                </label>

                <label className="admin-form-field" style={{ gridColumn: '1 / -1' }}>
                  <span>Adresse</span>
                  <input
                    type="text"
                    required
                    value={form.adresse}
                    onChange={(event) => updateField('adresse', event.target.value)}
                    placeholder="Rue, ville, code postal"
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
                  {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {detailsOpen && (
        <ClientDetailsModal
          client={detailsClient}
          loading={detailsLoading}
          onClose={closeDetailsModal}
        />
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(clientToDelete)}
        title="Etes-vous sur de vouloir supprimer ce client ?"
        message={
          clientToDelete
            ? `Le client "${
                clientToDelete.utilisateur?.name || 'sans nom'
              }" sera supprime. Le compte utilisateur lie restera, mais le profil client sera retire. Cette action est irreversible.`
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
