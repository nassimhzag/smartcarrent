import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useReservations from '../hooks/useReservations';
import useToast from '../hooks/useToast';
import { ToastStack } from '../components/Toast';
import UserReservationDetailsModal from '../components/UserReservationDetailsModal';
import Layout from '../layout/Layout';
import { ROUTES } from '../routes/paths';

/* =====================================================
   Mes réservations — version épurée
   Plus de filtres, plus de recherche : on affiche toute
   la liste, du plus récent au plus ancien. La carte ouvre
   un modal moderne contenant les détails et la facture.
   ===================================================== */

/* ---------- Helpers ---------- */

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

function formatDateLong(value) {
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
  // Compat libelles historiques (avant migration).
  if (statut === 'en_attente_paiement') return 'En attente paiement';
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

function totalForReservation(reservation) {
  const days = diffInDays(reservation.date_debut, reservation.date_fin);
  const dailyPrice = Number(reservation.voiture?.prix_par_jour || 0);
  const paid = reservation.paiement?.montant
    ? Number(reservation.paiement.montant)
    : null;
  if (paid !== null) return paid;
  return days * dailyPrice;
}

function reservationReference(reservation) {
  return `RES-${String(reservation.id || '').padStart(6, '0')}`;
}

/* ---------- Icones inline ---------- */

function IconSuitcase() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="7" width="18" height="14" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconBigCar() {
  return (
    <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 13.5l1.6-4.6A2 2 0 0 1 7 7.5h10a2 2 0 0 1 1.9 1.4l1.6 4.6" />
      <path d="M3 13.5h18v4a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 17 17.5V17H7v.5A1.5 1.5 0 0 1 5.5 19h-1A1.5 1.5 0 0 1 3 17.5z" />
      <circle cx="7.5" cy="15.5" r="1" />
      <circle cx="16.5" cy="15.5" r="1" />
    </svg>
  );
}

/* ---------- Card horizontale (clickable) ---------- */

function ReservationCard({ reservation, onOpenDetails }) {
  const voiture = reservation.voiture || {};
  const marque = voiture.marque || {};
  const days = diffInDays(reservation.date_debut, reservation.date_fin);
  const total = totalForReservation(reservation);

  return (
    <article
      className="userdash-card userdash-card-clickable"
      onClick={() => onOpenDetails(reservation)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetails(reservation);
        }
      }}
      aria-label={`Voir les détails de la réservation ${reservationReference(reservation)}`}
    >
      <div className="userdash-card-img">
        {voiture.image_url ? (
          <img src={voiture.image_url} alt={voiture.modele || 'Vehicule'} loading="lazy" />
        ) : (
          <div className="userdash-card-img-fallback">
            <span>{marque.nom || 'SmartCarRent'}</span>
          </div>
        )}
      </div>

      <div className="userdash-card-body">
        <div className="userdash-card-head">
          <div>
            <p className="userdash-card-marque">{marque.nom || 'Marque non précisée'}</p>
            <h3 className="userdash-card-title">{voiture.modele || 'Véhicule'}</h3>
          </div>
          <span className={statutBadgeClass(reservation.statut)}>
            {statutLabel(reservation.statut)}
          </span>
        </div>

        <div className="userdash-card-meta">
          <div>
            <span>Départ</span>
            <strong>{formatDate(reservation.date_debut)}</strong>
          </div>
          <div>
            <span>Retour</span>
            <strong>{formatDate(reservation.date_fin)}</strong>
          </div>
          <div>
            <span>Durée</span>
            <strong>
              {days} jour{days > 1 ? 's' : ''}
            </strong>
          </div>
          <div>
            <span>Total</span>
            <strong className="userdash-card-total">{total.toFixed(2)} DT</strong>
          </div>
        </div>

        <div className="userdash-card-footrow">
          <span className="userdash-card-ref">
            {reservationReference(reservation)} · créée le {formatDateLong(reservation.created_at)}
          </span>
          <button
            type="button"
            className="userdash-action userdash-action-ghost"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetails(reservation);
            }}
          >
            <IconEye />
            <span>Voir détails</span>
          </button>
        </div>
      </div>
    </article>
  );
}

/* ---------- Skeleton ---------- */

function ReservationCardSkeleton() {
  return (
    <div className="userdash-card userdash-card-skeleton" aria-hidden="true">
      <div className="userdash-card-img userdash-skeleton-block" />
      <div className="userdash-card-body">
        <div className="userdash-skeleton-line" style={{ width: '40%' }} />
        <div className="userdash-skeleton-line" style={{ width: '60%' }} />
        <div className="userdash-skeleton-line" style={{ width: '80%' }} />
        <div className="userdash-skeleton-line" style={{ width: '50%' }} />
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

export default function UserDashboard() {
  const historyParams = useMemo(() => ({ per_page: 100 }), []);
  const { reservations, loading, error, loadHistory } = useReservations(historyParams);
  const { toasts, success, error: toastError, dismiss } = useToast();
  const navigate = useNavigate();

  const [selected, setSelected] = useState(null);

  /* Stats globales pour le hero */
  const stats = useMemo(() => {
    const total = reservations.length;
    const enCours = reservations.filter((r) => r.statut === 'en_cours').length;
    const terminees = reservations.filter((r) => r.statut === 'terminee').length;
    const annulees = reservations.filter((r) => r.statut === 'annulee').length;
    return { total, enCours, terminees, annulees };
  }, [reservations]);

  /* Tri : du plus récent au plus ancien (par created_at, fallback date_debut) */
  const sorted = useMemo(() => {
    return [...reservations].sort((a, b) => {
      const aDate = new Date(a.created_at || a.date_debut).getTime();
      const bDate = new Date(b.created_at || b.date_debut).getTime();
      return bDate - aDate;
    });
  }, [reservations]);

  function handleOpenDetails(reservation) {
    setSelected(reservation);
  }

  function handleCloseDetails() {
    setSelected(null);
  }

  async function handleReservationCancelled(reservationId) {
    success(`Votre réservation #${reservationId} a bien été annulée.`);
    try {
      await loadHistory();
    } catch (e) {
      toastError('La liste a peut-être besoin d\'être rafraîchie manuellement.');
    }
  }

  return (
    <Layout>
      <div className="userdash-page">
        {/* ============ HERO ============ */}
        <section className="userdash-hero">
          <div className="userdash-hero-text">
            <span className="userdash-hero-icon" aria-hidden="true">
              <IconSuitcase />
            </span>
            <div>
              <h1>Mes réservations</h1>
              <p>Retrouvez ici toutes vos locations passées, en cours et à venir.</p>
            </div>
          </div>

          <div className="userdash-stats">
            <div className="userdash-stat">
              <span>Total</span>
              <strong>{loading ? '…' : stats.total}</strong>
            </div>
            <div className="userdash-stat tone-ok">
              <span>En cours</span>
              <strong>{loading ? '…' : stats.enCours}</strong>
            </div>
            <div className="userdash-stat tone-danger">
              <span>Annulées</span>
              <strong>{loading ? '…' : stats.annulees}</strong>
            </div>
            <div className="userdash-stat tone-info">
              <span>Terminées</span>
              <strong>{loading ? '…' : stats.terminees}</strong>
            </div>
          </div>
        </section>

        {/* ============ LISTE ============ */}
        {error && <p className="error-box">{error}</p>}

        {loading ? (
          <div className="userdash-list">
            {[0, 1, 2].map((i) => (
              <ReservationCardSkeleton key={i} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="userdash-empty">
            <div className="userdash-empty-illustration" aria-hidden="true">
              <IconBigCar />
            </div>
            <h3>Aucune réservation pour le moment</h3>
            <p>
              Parcourez le catalogue et trouvez le véhicule parfait pour votre prochain trajet.
            </p>
            <button
              type="button"
              className="userdash-action userdash-action-primary"
              onClick={() => navigate(ROUTES.VOITURES)}
            >
              Découvrir le catalogue
            </button>
          </div>
        ) : (
          <div className="userdash-list">
            {sorted.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                onOpenDetails={handleOpenDetails}
              />
            ))}
          </div>
        )}

        {/* ============ MODAL ============ */}
        {selected && (
          <UserReservationDetailsModal
            reservation={selected}
            onClose={handleCloseDetails}
            onCancelled={handleReservationCancelled}
          />
        )}

        <ToastStack toasts={toasts} onDismiss={dismiss} />
      </div>
    </Layout>
  );
}
