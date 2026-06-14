import { useState } from 'react';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { getApiErrorMessage } from '../api/errorUtils';
import {
  canDownloadFacture,
  downloadFactureForReservation,
} from '../services/factureService';
import { cancelReservation } from '../services/reservationService';

/**
 * Une reservation est annulable cote client si elle est encore en attente
 * de paiement et qu'aucun paiement n'a ete encaisse. Le backend renvoie 422
 * sinon (on affichera son message d'erreur dans ce cas).
 */
function canCancelReservation(reservation) {
  if (!reservation) return false;
  // Une reservation est annulable uniquement si elle est encore en cours
  // ET que le paiement n'a pas encore ete encaisse. Sinon le client doit
  // contacter l'agence pour un remboursement.
  if (reservation.statut !== 'en_cours') return false;
  if (reservation.paiement?.statut === 'paye') return false;
  return true;
}

function IconCancel() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M5.5 5.5l13 13" />
    </svg>
  );
}

/* =====================================================
   Modal client moderne (style "trip card" Airbnb/Booking)
   Affiche les details d'UNE reservation pour son proprietaire.
   ===================================================== */

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
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

function diffInDays(start, end) {
  if (!start || !end) return 0;
  const a = new Date(start);
  const b = new Date(end);
  const diff = Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff + 1, 1);
}

function statutLabel(statut) {
  if (statut === 'en_cours') return 'En cours';
  if (statut === 'annulee') return 'Annulée';
  if (statut === 'terminee') return 'Terminée';
  // Compat libelles historiques.
  if (statut === 'en_attente_paiement') return 'En attente de paiement';
  if (statut === 'confirmee') return 'Confirmée';
  return statut || '—';
}

function statutBadgeClass(statut) {
  if (statut === 'en_cours') return 'userdash-badge tone-ok';
  if (statut === 'annulee') return 'userdash-badge tone-danger';
  if (statut === 'terminee') return 'userdash-badge tone-info';
  // Compat
  if (statut === 'en_attente_paiement') return 'userdash-badge tone-warn';
  if (statut === 'confirmee') return 'userdash-badge tone-ok';
  return 'userdash-badge';
}

function paiementStatutLabel(statut) {
  if (statut === 'en_attente') return 'En attente';
  if (statut === 'paye') return 'Payé';
  if (statut === 'rembourse') return 'Remboursé';
  return statut || '—';
}

function paiementModeLabel(mode) {
  if (mode === 'carte') return 'Carte bancaire';
  if (mode === 'virement') return 'Virement';
  if (mode === 'especes') return 'Espèces (sur place)';
  if (mode === 'mobile_money') return 'Mobile Money';
  return mode || '—';
}

function IconPdf() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 13h1.5a1.5 1.5 0 0 1 0 3H9z" />
      <path d="M14 13v4" />
      <path d="M14 15h2" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function UserReservationDetailsModal({ reservation, onClose, onCancelled }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  if (!reservation) return null;

  const voiture = reservation.voiture || {};
  const marque = voiture.marque || {};
  const paiement = reservation.paiement || null;

  const days = diffInDays(reservation.date_debut, reservation.date_fin);
  const dailyPrice = Number(voiture.prix_par_jour || 0);
  const computedTotal = days * dailyPrice;
  const paidAmount = paiement?.montant != null ? Number(paiement.montant) : null;
  const total = paidAmount !== null ? paidAmount : computedTotal;

  const factureAvailable = canDownloadFacture(reservation);
  const cancellable = canCancelReservation(reservation);
  const reference = `RES-${String(reservation.id || '').padStart(6, '0')}`;

  async function handleDownloadFacture() {
    if (downloading) return;
    setDownloadError('');
    setDownloading(true);
    try {
      await downloadFactureForReservation(reservation.id);
    } catch (error) {
      setDownloadError(error?.message || 'Impossible de télécharger la facture.');
    } finally {
      setDownloading(false);
    }
  }

  async function handleConfirmCancel() {
    if (cancelling) return;
    setCancelError('');
    setCancelling(true);
    try {
      await cancelReservation(reservation.id);
      setConfirmCancelOpen(false);
      onCancelled?.(reservation.id);
      onClose?.();
    } catch (requestError) {
      setCancelError(
        getApiErrorMessage(
          requestError,
          'Impossible d\'annuler la réservation pour le moment.'
        )
      );
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div
      className="userdash-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="userdash-modal"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Hero : image voiture + reference + statut */}
        <div className="userdash-modal-hero">
          {voiture.image_url ? (
            <img
              src={voiture.image_url}
              alt={voiture.modele || 'Vehicule'}
              className="userdash-modal-hero-img"
            />
          ) : (
            <div className="userdash-modal-hero-fallback">
              <span>{marque.nom || 'SmartCarRent'}</span>
            </div>
          )}
          <div className="userdash-modal-hero-overlay">
            <span className="userdash-modal-ref">{reference}</span>
            <span className={statutBadgeClass(reservation.statut)}>
              {statutLabel(reservation.statut)}
            </span>
          </div>
          <button
            type="button"
            className="userdash-modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className="userdash-modal-body">
          <div className="userdash-modal-head">
            <h3>
              {marque.nom ? `${marque.nom} ` : ''}
              {voiture.modele || 'Véhicule'}
            </h3>
            <p className="userdash-modal-sub">
              Réservation créée le {formatDateTime(reservation.created_at)}
            </p>
          </div>

          {/* Trip dates : depart → retour */}
          <section className="userdash-modal-section">
            <h4>
              <IconCalendar />
              <span>Votre voyage</span>
            </h4>
            <div className="userdash-trip">
              <div className="userdash-trip-leg">
                <span className="userdash-trip-label">Départ</span>
                <strong>{formatDate(reservation.date_debut)}</strong>
              </div>
              <div className="userdash-trip-arrow" aria-hidden="true">
                <IconArrow />
              </div>
              <div className="userdash-trip-leg">
                <span className="userdash-trip-label">Retour</span>
                <strong>{formatDate(reservation.date_fin)}</strong>
              </div>
              <div className="userdash-trip-duration">
                <span className="userdash-trip-label">Durée</span>
                <strong>
                  {days} jour{days > 1 ? 's' : ''}
                </strong>
              </div>
            </div>
          </section>

          {/* Vehicule */}
          <section className="userdash-modal-section">
            <h4>Véhicule</h4>
            <div className="userdash-modal-grid">
              <div>
                <span>Marque</span>
                <strong>{marque.nom || '—'}</strong>
              </div>
              <div>
                <span>Modèle</span>
                <strong>{voiture.modele || '—'}</strong>
              </div>
              <div>
                <span>Immatriculation</span>
                <strong>{voiture.immatriculation || '—'}</strong>
              </div>
              <div>
                <span>Prix / jour</span>
                <strong>{dailyPrice.toFixed(2)} DT</strong>
              </div>
            </div>
          </section>

          {/* Paiement */}
          <section className="userdash-modal-section">
            <h4>Paiement</h4>
            {paiement ? (
              <div className="userdash-modal-grid">
                <div>
                  <span>Méthode</span>
                  <strong>{paiementModeLabel(paiement.mode_paiement)}</strong>
                </div>
                <div>
                  <span>Statut</span>
                  <strong>{paiementStatutLabel(paiement.statut)}</strong>
                </div>
                <div>
                  <span>Date du paiement</span>
                  <strong>{formatDate(paiement.date_paiement)}</strong>
                </div>
                <div>
                  <span>Montant payé</span>
                  <strong>{Number(paiement.montant || 0).toFixed(2)} DT</strong>
                </div>
              </div>
            ) : (
              <p className="userdash-modal-empty">
                Aucun paiement enregistré pour cette réservation.
              </p>
            )}
          </section>

          {/* Total */}
          <section className="userdash-modal-total">
            <div>
              <span>Total</span>
              <strong>{total.toFixed(2)} DT</strong>
            </div>
            {paidAmount !== null && (
              <p className="userdash-modal-totalnote">
                Montant payé via le paiement #{paiement?.id}
              </p>
            )}
          </section>

          {downloadError && (
            <p className="error-box" style={{ marginTop: 12 }}>
              {downloadError}
            </p>
          )}
          {cancelError && (
            <p className="error-box" style={{ marginTop: 12 }}>
              {cancelError}
            </p>
          )}
        </div>

        <footer
          className="userdash-modal-footer"
          style={{ flexWrap: 'wrap', gap: '10px' }}
        >
          {cancellable && (
            <button
              type="button"
              className="userdash-action userdash-action-danger"
              onClick={() => setConfirmCancelOpen(true)}
              disabled={cancelling}
              style={{ marginRight: 'auto' }}
              title="Annuler cette réservation"
            >
              <IconCancel />
              <span>Annuler la réservation</span>
            </button>
          )}
          <button
            type="button"
            className="facture-btn"
            onClick={handleDownloadFacture}
            disabled={!factureAvailable || downloading}
            title={
              factureAvailable
                ? 'Télécharger votre facture PDF'
                : 'La facture sera disponible une fois le paiement confirmé'
            }
          >
            <IconPdf />
            <span>{downloading ? 'Génération...' : 'Télécharger la facture'}</span>
          </button>
          <button
            type="button"
            className="userdash-secondary-btn"
            onClick={onClose}
          >
            Fermer
          </button>
        </footer>
      </div>

      <ConfirmDeleteModal
        isOpen={confirmCancelOpen}
        title="Annuler cette réservation ?"
        message={`Votre réservation ${reference} sera annulée définitivement et la voiture redeviendra disponible. Cette action est irréversible.`}
        confirmLabel="Oui, annuler"
        cancelLabel="Non, garder"
        onConfirm={handleConfirmCancel}
        onCancel={() => {
          if (cancelling) return;
          setConfirmCancelOpen(false);
        }}
        busy={cancelling}
      />
    </div>
  );
}
