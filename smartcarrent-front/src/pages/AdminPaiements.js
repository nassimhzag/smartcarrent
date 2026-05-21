import { useMemo, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import PaiementDetailsModal from '../components/PaiementDetailsModal';
import { ToastStack } from '../components/Toast';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { IconX, IconRefund, IconCheck } from '../components/AdminIcons';
import useAdminPaiements from '../hooks/useAdminPaiements';
import useToast from '../hooks/useToast';
import { getApiErrorMessage } from '../api/errorUtils';

const STATUTS = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'paye', label: 'Paye' },
  { value: 'echoue', label: 'Echoue' },
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
  if (statut === 'en_attente') return 'badge badge-warn';
  if (statut === 'paye') return 'badge badge-ok';
  if (statut === 'echoue') return 'badge badge-danger';
  if (statut === 'rembourse') return 'badge badge-muted';
  return 'badge';
}

function modeLabel(mode) {
  const found = MODES.find((m) => m.value === mode);
  return found ? found.label : mode;
}

export default function AdminPaiements() {
  const { paiements, loading, error, stats, reject, refund, confirmCash } = useAdminPaiements();
  const { toasts, success, error: toastError, dismiss } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('recent');

  const [selectedPaiement, setSelectedPaiement] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Modal de confirmation (Annuler ou Rembourser selon le mode)
  const [pendingAction, setPendingAction] = useState(null);
  // pendingAction = { paiement, type: 'cancel' | 'refund' } | null

  const filteredPaiements = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = paiements.filter((p) => {
      const clientName = String(p.reservation?.client?.utilisateur?.name || '').toLowerCase();
      const clientEmail = String(p.reservation?.client?.utilisateur?.email || '').toLowerCase();
      const voitureModele = String(p.reservation?.voiture?.modele || '').toLowerCase();
      const voitureImmat = String(p.reservation?.voiture?.immatriculation || '').toLowerCase();

      const matchesQuery =
        q === '' ||
        clientName.includes(q) ||
        clientEmail.includes(q) ||
        voitureModele.includes(q) ||
        voitureImmat.includes(q);

      const matchesStatus = statusFilter === 'all' || p.statut === statusFilter;
      const matchesMode = modeFilter === 'all' || p.mode_paiement === modeFilter;

      return matchesQuery && matchesStatus && matchesMode;
    });

    return filtered.sort((a, b) => {
      const aDate = new Date(a.date_paiement || a.created_at).getTime();
      const bDate = new Date(b.date_paiement || b.created_at).getTime();
      return sortOrder === 'oldest' ? aDate - bDate : bDate - aDate;
    });
  }, [paiements, search, statusFilter, modeFilter, sortOrder]);

  function askCancel(paiement, event) {
    if (event) event.stopPropagation();
    setPendingAction({ paiement, type: 'cancel' });
  }

  function askRefund(paiement, event) {
    if (event) event.stopPropagation();
    setPendingAction({ paiement, type: 'refund' });
  }

  function askConfirm(paiement, event) {
    if (event) event.stopPropagation();
    setPendingAction({ paiement, type: 'confirm' });
  }

  function closeConfirm() {
    if (busyId) return;
    setPendingAction(null);
  }

  async function confirmAction() {
    if (!pendingAction) return;
    const { paiement, type } = pendingAction;
    setBusyId(paiement.id);
    try {
      if (type === 'cancel') {
        await reject(paiement.id);
        success(`Paiement #${paiement.id} annule. Reservation annulee.`);
      } else if (type === 'refund') {
        await refund(paiement.id);
        success(`Paiement #${paiement.id} rembourse. Reservation annulee.`);
      } else if (type === 'confirm') {
        await confirmCash(paiement.id);
        success(`Paiement #${paiement.id} confirme. Le client a recu un email.`);
      }
      setPendingAction(null);
    } catch (requestError) {
      const fallback =
        type === 'cancel'
          ? "Impossible d'annuler le paiement."
          : type === 'refund'
          ? 'Impossible de rembourser le paiement.'
          : 'Impossible de confirmer le paiement.';
      toastError(getApiErrorMessage(requestError, fallback));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminLayout
      title="Gestion des paiements"
      subtitle="Valider ou rembourser les paiements clients"
    >
      <section className="admin-mini-stats">
        <div className="admin-mini-stat">
          <span>Total paiements</span>
          <strong>{loading ? '…' : stats.total}</strong>
        </div>
        <div className="admin-mini-stat tone-amber">
          <span>En attente</span>
          <strong>{loading ? '…' : stats.enAttente}</strong>
        </div>
        <div className="admin-mini-stat tone-info">
          <span>Aujourd'hui</span>
          <strong>{loading ? '…' : stats.aujourdhui}</strong>
        </div>
        <div className="admin-mini-stat tone-revenue">
          <span>Revenus valides</span>
          <strong>{loading ? '…' : `${Number(stats.revenus).toFixed(2)} DT`}</strong>
        </div>
      </section>

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
                  const isCash = p.mode_paiement === 'especes';
                  // Cash en attente : admin peut Confirmer (paye) OU Annuler (echoue)
                  const canConfirmCash = isCash && p.statut === 'en_attente';
                  // Cash deja paye : admin peut encore Annuler en cas d'erreur
                  const canCancelCash =
                    isCash && (p.statut === 'en_attente' || p.statut === 'paye');
                  // Carte : on peut Rembourser une fois paye
                  const canRefundOnline = !isCash && p.statut === 'paye';
                  return (
                    <tr
                      key={p.id}
                      className="admin-table-row-clickable"
                      onClick={() => setSelectedPaiement(p)}
                      title="Cliquer pour voir les details"
                    >
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
                        <span className={statutBadgeClass(p.statut)}>{statutLabel(p.statut)}</span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          {canConfirmCash && (
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-success"
                              onClick={(event) => askConfirm(p, event)}
                              disabled={isBusy}
                              aria-label="Confirmer le paiement sur place"
                              title="Confirmer le paiement (argent recu)"
                            >
                              <IconCheck />
                            </button>
                          )}
                          {canCancelCash && (
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-danger"
                              onClick={(event) => askCancel(p, event)}
                              disabled={isBusy}
                              aria-label="Annuler le paiement"
                              title="Annuler (paiement non recu)"
                            >
                              <IconX />
                            </button>
                          )}
                          {canRefundOnline && (
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
        />
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(pendingAction)}
        title={
          pendingAction?.type === 'cancel'
            ? 'Annuler ce paiement (especes) ?'
            : pendingAction?.type === 'confirm'
            ? 'Confirmer ce paiement sur place ?'
            : 'Rembourser ce paiement ?'
        }
        message={
          pendingAction
            ? pendingAction.type === 'cancel'
              ? `Le paiement #${pendingAction.paiement.id} (${Number(pendingAction.paiement.montant).toFixed(2)} DT en especes) sera marque comme echoue. La reservation sera annulee et la voiture redeviendra disponible. Aucun argent ne sera rembourse car aucun argent n'a ete recu.`
              : pendingAction.type === 'confirm'
              ? `Confirmer la reception de ${Number(pendingAction.paiement.montant).toFixed(2)} DT pour le paiement #${pendingAction.paiement.id} ? Le paiement passera a "Paye", la reservation sera confirmee et un email de confirmation sera envoye au client.`
              : `Le paiement #${pendingAction.paiement.id} (${Number(pendingAction.paiement.montant).toFixed(2)} DT) sera rembourse au client. La reservation sera annulee et la voiture redeviendra disponible.`
            : null
        }
        confirmLabel={
          pendingAction?.type === 'cancel'
            ? 'Annuler le paiement'
            : pendingAction?.type === 'confirm'
            ? 'Confirmer le paiement'
            : 'Rembourser'
        }
        cancelLabel="Retour"
        onConfirm={confirmAction}
        onCancel={closeConfirm}
        busy={Boolean(busyId)}
      />

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </AdminLayout>
  );
}
