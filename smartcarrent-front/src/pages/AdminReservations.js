import { useMemo, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import ReservationDetailsModal from '../components/ReservationDetailsModal';
import { ToastStack } from '../components/Toast';
import useAdminReservations from '../hooks/useAdminReservations';
import useToast from '../hooks/useToast';
import { getApiErrorMessage } from '../api/errorUtils';

const STATUTS = [
  { value: 'en_cours', label: 'En cours' },
  { value: 'terminee', label: 'Terminees' },
  { value: 'annulee', label: 'Annulees' },
];

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l4 4 10-10" />
    </svg>
  );
}

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

function statutLabel(statut) {
  const found = STATUTS.find((s) => s.value === statut);
  if (found) return found.label;
  if (statut === 'en_attente_paiement') return 'En attente paiement';
  if (statut === 'confirmee') return 'Confirmee';
  return statut || '—';
}

function statutBadgeClass(statut) {
  if (statut === 'en_cours') return 'badge badge-ok';
  if (statut === 'terminee') return 'badge badge-info';
  if (statut === 'annulee') return 'badge badge-danger';
  if (statut === 'en_attente_paiement') return 'badge badge-warn';
  if (statut === 'confirmee') return 'badge badge-ok';
  return 'badge';
}

function computeTotal(reservation) {
  const paid = reservation.paiement?.montant;
  if (paid !== null && paid !== undefined && paid !== '') {
    return Number(paid);
  }
  const days = diffInDays(reservation.date_debut, reservation.date_fin);
  const daily = Number(reservation.voiture?.prix_par_jour || 0);
  return days * daily;
}

function isFutureDate(dateStr) {
  if (!dateStr) return false;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d.getTime() > today.getTime();
  } catch (e) {
    return false;
  }
}

export default function AdminReservations() {
  const { reservations, loading, error, remove, terminer } = useAdminReservations();
  const { toasts, success, error: toastError, dismiss } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('recent');

  const [selectedReservation, setSelectedReservation] = useState(null);
  const [reservationToDelete, setReservationToDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const filteredReservations = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = reservations.filter((r) => {
      const clientName = String(r.client?.utilisateur?.name || '').toLowerCase();
      const clientEmail = String(r.client?.utilisateur?.email || '').toLowerCase();
      const voitureModele = String(r.voiture?.modele || '').toLowerCase();
      const voitureMarque = String(r.voiture?.marque?.nom || '').toLowerCase();
      const voitureImmat = String(r.voiture?.immatriculation || '').toLowerCase();

      const matchesQuery =
        q === '' ||
        clientName.includes(q) ||
        clientEmail.includes(q) ||
        voitureModele.includes(q) ||
        voitureMarque.includes(q) ||
        voitureImmat.includes(q);

      const matchesStatus = statusFilter === 'all' || r.statut === statusFilter;

      return matchesQuery && matchesStatus;
    });

    return filtered.sort((a, b) => {
      const aDate = new Date(a.created_at || a.date_debut).getTime();
      const bDate = new Date(b.created_at || b.date_debut).getTime();
      return sortOrder === 'oldest' ? aDate - bDate : bDate - aDate;
    });
  }, [reservations, search, statusFilter, sortOrder]);

  function openDetails(reservation) {
    setSelectedReservation(reservation);
  }

  function closeDetails() {
    setSelectedReservation(null);
  }

  function askDelete(reservation, event) {
    if (event) event.stopPropagation();
    setReservationToDelete(reservation);
  }

  function cancelDelete() {
    setReservationToDelete(null);
  }

  async function confirmDelete() {
    if (!reservationToDelete) return;
    const target = reservationToDelete;
    setBusyId(target.id);
    try {
      await remove(target.id);
      success(`Reservation #${target.id} supprimee.`);
      setReservationToDelete(null);
    } catch (requestError) {
      toastError(
        getApiErrorMessage(requestError, 'Impossible de supprimer la reservation.')
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleTerminer(reservation, event) {
    if (event) event.stopPropagation();
    if (!reservation) return;
    setBusyId(reservation.id);
    try {
      await terminer(reservation.id);
      success(
        `Reservation #${reservation.id} cloturee. Le vehicule est de nouveau disponible.`
      );
    } catch (requestError) {
      toastError(
        getApiErrorMessage(
          requestError,
          'Impossible de cloturer la reservation.'
        )
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminLayout
      title="Gestion des reservations"
      subtitle="Cliquez sur une ligne pour voir le detail"
    >
      <section className="admin-toolbar">
        <div className="admin-toolbar-filters">
          <input
            className="admin-input"
            type="search"
            placeholder="Rechercher par client, email, voiture, immat..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="admin-input"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filtrer par statut"
          >
            <option value="all">Tous les statuts</option>
            {STATUTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            className="admin-input"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          >
            <option value="recent">Plus recentes d'abord</option>
            <option value="oldest">Plus anciennes d'abord</option>
          </select>
        </div>
      </section>

      {error && <p className="error-box">{error}</p>}

      <section className="admin-panel admin-table-panel">
        {loading ? (
          <div className="admin-loading-row">
            <span className="admin-spinner" aria-hidden="true" />
            <span>Chargement des reservations...</span>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon" aria-hidden="true">📭</div>
            <p>
              <strong>Aucune reservation trouvee.</strong>
            </p>
            <p className="muted-row">
              Modifie tes filtres ou attends qu'un client effectue sa premiere reservation.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Vehicule</th>
                  <th>Date debut</th>
                  <th>Date fin</th>
                  <th>Prix total</th>
                  <th>Statut</th>
                  <th className="admin-table-actions-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((r) => {
                  const total = computeTotal(r);
                  const isBusy = busyId === r.id;
                  const dateFinReached = !isFutureDate(r.date_fin);
                  // Conditions pour cloturer une location :
                  //  - reservation en cours
                  //  - date de fin atteinte
                  //  - paiement encaisse (paye)
                  const canTerminer =
                    r.statut === 'en_cours' &&
                    dateFinReached &&
                    r.paiement?.statut === 'paye';
                  let terminerTitle;
                  if (canTerminer) {
                    terminerTitle = 'Terminer la location (le client a rendu le vehicule)';
                  } else if (!dateFinReached) {
                    terminerTitle = 'Impossible : la date de fin de location n est pas encore atteinte (' + formatDate(r.date_fin) + ')';
                  } else if (r.paiement?.statut !== 'paye') {
                    terminerTitle = 'Impossible : aucun paiement encaisse pour cette reservation';
                  } else {
                    terminerTitle = 'Impossible de cloturer cette reservation';
                  }
                  return (
                    <tr
                      key={r.id}
                      className="admin-table-row-clickable"
                      onClick={() => openDetails(r)}
                      title="Cliquer pour voir le detail"
                    >
                      <td>
                        <strong>{r.client?.utilisateur?.name || '—'}</strong>
                        <div className="muted-row">{r.client?.utilisateur?.email || '—'}</div>
                      </td>
                      <td>
                        <strong>{r.voiture?.modele || '—'}</strong>
                      </td>
                      <td>{formatDate(r.date_debut)}</td>
                      <td>{formatDate(r.date_fin)}</td>
                      <td>
                        <strong>{total.toFixed(2)} DT</strong>
                      </td>
                      <td>
                        <span className={statutBadgeClass(r.statut)}>{statutLabel(r.statut)}</span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          {r.statut === 'en_cours' && (
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-success"
                              onClick={(event) => handleTerminer(r, event)}
                              disabled={isBusy || !canTerminer}
                              aria-label="Terminer la location"
                              title={terminerTitle}
                            >
                              {isBusy ? (
                                <span className="admin-spinner" aria-hidden="true" />
                              ) : (
                                <IconCheck />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            className="admin-icon-btn admin-icon-danger"
                            onClick={(event) => askDelete(r, event)}
                            disabled={isBusy}
                            aria-label="Supprimer la reservation"
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

      {selectedReservation && (
        <ReservationDetailsModal
          reservation={selectedReservation}
          onClose={closeDetails}
          onTerminer={
            selectedReservation.statut === 'en_cours' &&
            selectedReservation.paiement?.statut === 'paye' &&
            !isFutureDate(selectedReservation.date_fin)
              ? () => handleTerminer(selectedReservation)
              : null
          }
        />
      )}

      {reservationToDelete && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={cancelDelete}
        >
          <div
            className="admin-modal admin-confirm-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="admin-confirm-head">
              <span className="admin-confirm-icon" aria-hidden="true">
                <IconTrash />
              </span>
              <h3>Etes-vous sur de vouloir supprimer cette reservation ?</h3>
            </header>

            <p className="admin-confirm-message">
              La reservation <strong>#{reservationToDelete.id}</strong> pour{' '}
              <strong>{reservationToDelete.client?.utilisateur?.name || 'ce client'}</strong> sera
              supprimee definitivement. Cette action est irreversible.
            </p>

            <footer className="admin-form-footer" style={{ padding: '14px 22px' }}>
              <button
                type="button"
                className="admin-secondary-btn"
                onClick={cancelDelete}
                disabled={busyId === reservationToDelete.id}
              >
                Annuler
              </button>
              <button
                type="button"
                className="admin-primary-btn admin-primary-danger"
                onClick={confirmDelete}
                disabled={busyId === reservationToDelete.id}
              >
                {busyId === reservationToDelete.id ? 'Suppression...' : 'Confirmer'}
              </button>
            </footer>
          </div>
        </div>
      )}

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </AdminLayout>
  );
}
