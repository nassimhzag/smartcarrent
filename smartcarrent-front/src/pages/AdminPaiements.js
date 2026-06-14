import { useMemo, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import PaiementDetailsModal from '../components/PaiementDetailsModal';
import ReservationDetailsModal from '../components/ReservationDetailsModal';
import { ToastStack } from '../components/Toast';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { IconEye, IconRefund } from '../components/AdminIcons';
import useAdminPaiements from '../hooks/useAdminPaiements';
import useToast from '../hooks/useToast';
import { getApiErrorMessage } from '../api/errorUtils';

const STATUTS = [
  { value: 'paye', label: 'Paye' },
  { value: 'rembourse', label: 'Rembourse' },
];

const MODES = [
  { value: 'carte', label: 'Carte' },
  { value: 'virement', label: 'Virement' },
  { value: 'especes', label: 'Especes' },
  { value: 'mobile_money', label: 'Mobile Money' },
];

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

function statutLabel(statut) {
  const found = STATUTS.find((s) => s.value === statut);
  return found ? found.label : statut;
}

function statutBadgeClass(statut) {
  if (statut === 'paye') return 'badge badge-ok';
  if (statut === 'rembourse') return 'badge badge-muted';
  return 'badge';
}

function modeLabel(mode) {
  const found = MODES.find((m) => m.value === mode);
  return found ? found.label : mode;
}

function paiementReference(p) {
  return `PAY-${String(p.id).padStart(6, '0')}`;
}

export default function AdminPaiements() {
  const { paiements, loading, error, stats, refund } = useAdminPaiements();
  const { toasts, success, error: toastError, dismiss } = useToast();

  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('recent');

  const [selectedPaiement, setSelectedPaiement] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Modal de confirmation pour le remboursement
  const [pendingRefund, setPendingRefund] = useState(null);

  const filteredPaiements = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = paiements.filter((p) => {
      const clientName = String(p.reservation?.client?.utilisateur?.name || '').toLowerCase();
      const clientEmail = String(p.reservation?.client?.utilisateur?.email || '').toLowerCase();
      const voitureModele = String(p.reservation?.voiture?.modele || '').toLowerCase();
      const voitureImmat = String(p.reservation?.voiture?.immatriculation || '').toLowerCase();
      const ref = paiementReference(p).toLowerCase();

      const matchesQuery =
        q === '' ||
        ref.includes(q) ||
        clientName.includes(q) ||
        clientEmail.includes(q) ||
        voitureModele.includes(q) ||
        voitureImmat.includes(q);

      const matchesMode = modeFilter === 'all' || p.mode_paiement === modeFilter;

      return matchesQuery && matchesMode;
    });

    return filtered.sort((a, b) => {
      const aDate = new Date(a.date_paiement || a.created_at).getTime();
      const bDate = new Date(b.date_paiement || b.created_at).getTime();
      return sortOrder === 'oldest' ? aDate - bDate : bDate - aDate;
    });
  }, [paiements, search, modeFilter, sortOrder]);

  function openDetails(paiement, event) {
    if (event) event.stopPropagation();
    setSelectedPaiement(paiement);
  }

  function askRefund(paiement, event) {
    if (event) event.stopPropagation();
    setPendingRefund(paiement);
  }

  function closeRefundModal() {
    if (busyId) return;
    setPendingRefund(null);
  }

  async function confirmRefund() {
    if (!pendingRefund) return;
    const paiement = pendingRefund;
    setBusyId(paiement.id);
    try {
      await refund(paiement.id);
      success(
        `Paiement ${paiementReference(paiement)} rembourse. La reservation a ete annulee et la voiture est de nouveau disponible.`
      );
      setPendingRefund(null);
      // Si le modal details est ouvert sur le meme paiement, on le ferme
      if (selectedPaiement?.id === paiement.id) {
        setSelectedPaiement(null);
      }
    } catch (requestError) {
      toastError(
        getApiErrorMessage(requestError, 'Impossible de rembourser le paiement.')
      );
    } finally {
      setBusyId(null);
    }
  }

  // Demande "Voir reservation" depuis le modal paiement
  function handleShowReservation(reservation) {
    if (!reservation) return;
    setSelectedPaiement(null);
    setSelectedReservation(reservation);
  }

  return (
    <AdminLayout
      title="Suivi des paiements"
      subtitle="Historique et consultation des transactions financieres"
    >
      <section className="admin-mini-stats">
        <div className="admin-mini-stat tone-revenue">
          <span>Revenus totaux</span>
          <strong>{loading ? '…' : `${Number(stats.revenus).toFixed(2)} DT`}</strong>
        </div>
        <div className="admin-mini-stat">
          <span>Total paiements</span>
          <strong>{loading ? '…' : stats.total}</strong>
        </div>
        <div className="admin-mini-stat tone-info">
          <span>Aujourd'hui</span>
          <strong>{loading ? '…' : stats.aujourdhui}</strong>
        </div>
        <div className="admin-mini-stat tone-muted">
          <span>Montant rembourse</span>
          <strong>
            {loading ? '…' : `${Number(stats.montantRembourse).toFixed(2)} DT`}
          </strong>
        </div>
      </section>

      <section className="admin-toolbar">
        <div className="admin-toolbar-filters">
          <input
            className="admin-input"
            type="search"
            placeholder="Rechercher par reference, client, email, voiture..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="admin-input"
            value={modeFilter}
            onChange={(event) => setModeFilter(event.target.value)}
          >
            <option value="all">Toutes les methodes</option>
            {MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            className="admin-input"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          >
            <option value="recent">Plus recents d'abord</option>
            <option value="oldest">Plus anciens d'abord</option>
          </select>
        </div>
      </section>

      {error && <p className="error-box">{error}</p>}

      <section className="admin-panel admin-table-panel">
        {loading ? (
          <div className="admin-loading-row">
            <span className="admin-spinner" aria-hidden="true" />
            <span>Chargement des paiements...</span>
          </div>
        ) : filteredPaiements.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon" aria-hidden="true">💳</div>
            <p>
              <strong>Aucun paiement trouve.</strong>
            </p>
            <p className="muted-row">
              Modifie tes filtres ou attends qu'un client effectue un paiement.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Client</th>
                  <th>Vehicule</th>
                  <th>Montant</th>
                  <th>Methode</th>
                  <th>Date paiement</th>
                  <th>Statut</th>
                  <th className="admin-table-actions-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPaiements.map((p) => {
                  const isBusy = busyId === p.id;
                  const canRefund = p.statut === 'paye';
                  return (
                    <tr
                      key={p.id}
                      className="admin-table-row-clickable"
                      onClick={() => setSelectedPaiement(p)}
                      title="Cliquer pour voir les details"
                    >
                      <td>
                        <strong className="admin-mono">{paiementReference(p)}</strong>
                      </td>
                      <td>
                        <strong>{p.reservation?.client?.utilisateur?.name || '—'}</strong>
                        <div className="muted-row">
                          {p.reservation?.client?.utilisateur?.email || '—'}
                        </div>
                      </td>
                      <td>
                        <strong>{p.reservation?.voiture?.modele || '—'}</strong>
                      </td>
                      <td>
                        <strong>{Number(p.montant || 0).toFixed(2)} DT</strong>
                      </td>
                      <td>{modeLabel(p.mode_paiement)}</td>
                      <td>{formatDate(p.date_paiement)}</td>
                      <td>
                        <span className={statutBadgeClass(p.statut)}>
                          {statutLabel(p.statut)}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-icon-btn admin-icon-view"
                            onClick={(event) => openDetails(p, event)}
                            aria-label="Voir les details du paiement"
                            title="Voir les details"
                          >
                            <IconEye />
                          </button>
                          {canRefund && (
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-warn"
                              onClick={(event) => askRefund(p, event)}
                              disabled={isBusy}
                              aria-label="Rembourser le paiement"
                              title="Rembourser le client"
                            >
                              <IconRefund />
                            </button>
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

      {selectedPaiement && (
        <PaiementDetailsModal
          paiement={selectedPaiement}
          onClose={() => setSelectedPaiement(null)}
          onShowReservation={handleShowReservation}
        />
      )}

      {selectedReservation && (
        <ReservationDetailsModal
          reservation={selectedReservation}
          onClose={() => setSelectedReservation(null)}
        />
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(pendingRefund)}
        title="Etes-vous sur de vouloir rembourser ce paiement ?"
        message={
          pendingRefund
            ? `Le paiement ${paiementReference(pendingRefund)} (${Number(pendingRefund.montant).toFixed(2)} DT) sera rembourse au client. La reservation associee sera annulee et la voiture redeviendra disponible. Cette action est irreversible.`
            : null
        }
        confirmLabel="Rembourser"
        cancelLabel="Retour"
        onConfirm={confirmRefund}
        onCancel={closeRefundModal}
        busy={Boolean(busyId)}
      />

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </AdminLayout>
  );
}
