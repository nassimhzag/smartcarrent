import { useState } from 'react';
import {
  canDownloadFacture,
  downloadFactureForReservation,
} from '../services/factureService';

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

function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return String(value);
  }
}

function statutLabel(statut) {
  if (statut === 'paye') return 'Paye';
  if (statut === 'rembourse') return 'Rembourse';
  return statut || '—';
}

function statutBadgeClass(statut) {
  if (statut === 'paye') return 'badge badge-ok';
  if (statut === 'rembourse') return 'badge badge-muted';
  return 'badge';
}

function modeLabel(mode) {
  if (mode === 'carte') return 'Carte bancaire';
  if (mode === 'virement') return 'Virement';
  if (mode === 'especes') return 'Especes';
  if (mode === 'mobile_money') return 'Mobile Money';
  return mode || '—';
}

function paiementReference(paiement) {
  return `PAY-${String(paiement.id).padStart(6, '0')}`;
}

function IconPdf() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 13h1.5a1.5 1.5 0 0 1 0 3H9z" />
      <path d="M14 13v4" />
      <path d="M14 15h2" />
    </svg>
  );
}

function IconReservation() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M8 14h3" />
      <path d="M8 18h6" />
    </svg>
  );
}

export default function PaiementDetailsModal({ paiement, onClose, onShowReservation }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  if (!paiement) return null;

  const reservation = paiement.reservation || {};
  const client = reservation.client || {};
  const utilisateur = client.utilisateur || {};
  const voiture = reservation.voiture || {};

  // La facture est telechargeable des qu'un paiement est encaisse.
  // On synthetise un objet reservation enrichi pour reutiliser canDownloadFacture
  // (qui s'attend a voir reservation.paiement renseigne).
  const reservationWithPaiement = {
    ...reservation,
    paiement: { statut: paiement.statut },
  };
  const factureAvailable = canDownloadFacture(reservationWithPaiement);
  const canShowReservation = Boolean(reservation?.id) && typeof onShowReservation === 'function';

  async function handleDownloadFacture() {
    if (downloading || !reservation?.id) return;
    setDownloadError('');
    setDownloading(true);
    try {
      await downloadFactureForReservation(reservation.id);
    } catch (error) {
      setDownloadError(error?.message || 'Impossible de telecharger la facture.');
    } finally {
      setDownloading(false);
    }
  }

  function handleViewReservation() {
    if (canShowReservation) onShowReservation(reservation);
  }

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
        <header className="admin-modal-head">
          <div>
            <h3>Detail paiement {paiementReference(paiement)}</h3>
            <p className="muted-row" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
              Cree le {formatDateTime(paiement.created_at)}
            </p>
          </div>
          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </header>

        <div className="admin-detail-body">
          <section className="admin-detail-section">
            <h4>Client</h4>
            <div className="admin-detail-grid">
              <div>
                <span>Nom</span>
                <strong>{utilisateur.name || '—'}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{utilisateur.email || '—'}</strong>
              </div>
              <div>
                <span>Telephone</span>
                <strong>{client.telephone || '—'}</strong>
              </div>
            </div>
          </section>

          <section className="admin-detail-section">
            <h4>Vehicule</h4>
            <div className="admin-detail-grid">
              <div>
                <span>Modele</span>
                <strong>{voiture.modele || '—'}</strong>
              </div>
              <div>
                <span>Immatriculation</span>
                <strong>{voiture.immatriculation || '—'}</strong>
              </div>
              <div>
                <span>Prix par jour</span>
                <strong>
                  {voiture.prix_par_jour
                    ? `${Number(voiture.prix_par_jour).toFixed(2)} DT`
                    : '—'}
                </strong>
              </div>
            </div>
          </section>

          <section className="admin-detail-section">
            <h4>Reservation liee</h4>
            <div className="admin-detail-grid">
              <div>
                <span>Reference</span>
                <strong>RES-{String(reservation.id || '').padStart(6, '0')}</strong>
              </div>
              <div>
                <span>Statut reservation</span>
                <strong>{reservation.statut || '—'}</strong>
              </div>
              <div>
                <span>Date debut</span>
                <strong>{formatDate(reservation.date_debut)}</strong>
              </div>
              <div>
                <span>Date fin</span>
                <strong>{formatDate(reservation.date_fin)}</strong>
              </div>
            </div>
          </section>

          <section className="admin-detail-section">
            <h4>Paiement</h4>
            <div className="admin-detail-grid">
              <div>
                <span>Reference</span>
                <strong>{paiementReference(paiement)}</strong>
              </div>
              <div>
                <span>Methode</span>
                <strong>{modeLabel(paiement.mode_paiement)}</strong>
              </div>
              <div>
                <span>Statut</span>
                <span className={statutBadgeClass(paiement.statut)}>
                  {statutLabel(paiement.statut)}
                </span>
              </div>
              <div>
                <span>Date paiement</span>
                <strong>{formatDate(paiement.date_paiement)}</strong>
              </div>
              <div>
                <span>Date validation</span>
                <strong>{formatDateTime(paiement.date_validation)}</strong>
              </div>
              <div>
                <span>Date remboursement</span>
                <strong>{formatDateTime(paiement.date_remboursement)}</strong>
              </div>
              <div className="admin-detail-total">
                <span>Montant</span>
                <strong>{Number(paiement.montant || 0).toFixed(2)} DT</strong>
              </div>
            </div>
          </section>

          {downloadError && (
            <p className="error-box" style={{ marginTop: 0 }}>
              {downloadError}
            </p>
          )}
        </div>

        <footer
          className="admin-form-footer"
          style={{ padding: '14px 22px', flexWrap: 'wrap', gap: '10px' }}
        >
          {canShowReservation && (
            <button
              type="button"
              className="admin-secondary-btn admin-icon-inline"
              onClick={handleViewReservation}
              title="Voir le detail de la reservation associee"
            >
              <IconReservation />
              <span>Voir reservation</span>
            </button>
          )}
          <button
            type="button"
            className="facture-btn"
            onClick={handleDownloadFacture}
            disabled={!factureAvailable || downloading}
            title={
              factureAvailable
                ? 'Telecharger la facture PDF'
                : 'Facture disponible apres confirmation du paiement'
            }
          >
            <IconPdf />
            <span>{downloading ? 'Generation...' : 'Telecharger facture'}</span>
          </button>
          <button type="button" className="admin-secondary-btn" onClick={onClose}>
            Fermer
          </button>
        </footer>
      </div>
    </div>
  );
}
