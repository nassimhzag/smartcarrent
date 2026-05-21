import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../layout/Layout';
import { ToastStack } from '../components/Toast';
import useToast from '../hooks/useToast';
import { getReservationById } from '../services/reservationService';
import { payReservation } from '../services/paiementService';
import { ROUTES } from '../routes/paths';
import { getApiErrorMessage } from '../api/errorUtils';

const MODES = [
  { value: 'carte', label: 'Carte bancaire' },
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

function diffInDays(start, end) {
  if (!start || !end) return 0;
  const a = new Date(start);
  const b = new Date(end);
  const diff = Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff + 1, 1);
}

export default function PaiementPage() {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const { toasts, success, error: toastError, dismiss } = useToast();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [mode, setMode] = useState('carte');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadReservation() {
      try {
        setLoading(true);
        setLoadError('');
        const data = await getReservationById(reservationId);
        if (!cancelled) {
          setReservation(data);
        }
      } catch (requestError) {
        if (!cancelled) {
          setLoadError(
            getApiErrorMessage(requestError, 'Impossible de charger la reservation.')
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadReservation();
    return () => {
      cancelled = true;
    };
  }, [reservationId]);

  const days = diffInDays(reservation?.date_debut, reservation?.date_fin);
  const dailyPrice = Number(reservation?.voiture?.prix_par_jour || 0);
  const totalAmount = days * dailyPrice;

  const isAlreadyPaid =
    reservation && (reservation.paiement || reservation.statut === 'confirmee');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!reservation) return;

    setSubmitting(true);
    setFormError('');

    try {
      const today = new Date().toISOString().slice(0, 10);
      await payReservation({
        reservation_id: reservation.id,
        montant: totalAmount,
        date_paiement: today,
        mode_paiement: mode,
      });
      const successMessage =
        mode === 'especes'
          ? 'Reservation enregistree. Venez payer sur place pour la confirmer.'
          : 'Paiement effectue. Reservation confirmee.';
      success(successMessage);
      // Petit delai pour laisser apparaitre le toast
      setTimeout(() => navigate(ROUTES.USER_DASHBOARD, { replace: true }), 1200);
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Echec du paiement. Reessayez.');
      setFormError(message);
      toastError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <div className="paiement-shell">
        <header className="paiement-head">
          <p className="kicker">Paiement reservation</p>
          <h1>Finaliser votre reservation</h1>
          <p className="muted-row">
            Votre reservation est en attente de paiement. Validez le montant pour la confirmer.
          </p>
        </header>

        {loading && (
          <div className="admin-loading-row" style={{ padding: 22 }}>
            <span className="admin-spinner" aria-hidden="true" />
            <span>Chargement de la reservation...</span>
          </div>
        )}

        {loadError && <p className="error-box">{loadError}</p>}

        {reservation && !loading && (
          <div className="paiement-grid">
            <section className="panel paiement-summary">
              <h3>Resume de la reservation</h3>
              <ul className="paiement-summary-list">
                <li>
                  <span>Reference</span>
                  <strong>RES-{reservation.id}</strong>
                </li>
                <li>
                  <span>Vehicule</span>
                  <strong>{reservation.voiture?.modele || '—'}</strong>
                </li>
                <li>
                  <span>Immatriculation</span>
                  <strong>{reservation.voiture?.immatriculation || '—'}</strong>
                </li>
                <li>
                  <span>Du</span>
                  <strong>{formatDate(reservation.date_debut)}</strong>
                </li>
                <li>
                  <span>Au</span>
                  <strong>{formatDate(reservation.date_fin)}</strong>
                </li>
                <li>
                  <span>Duree</span>
                  <strong>
                    {days} jour{days > 1 ? 's' : ''}
                  </strong>
                </li>
                <li>
                  <span>Prix par jour</span>
                  <strong>{dailyPrice.toFixed(2)} DT</strong>
                </li>
                <li className="paiement-summary-total">
                  <span>Montant total</span>
                  <strong>{totalAmount.toFixed(2)} DT</strong>
                </li>
              </ul>
            </section>

            <section className="panel paiement-form-panel">
              {isAlreadyPaid ? (
                <div className="paiement-already-paid">
                  <h3>Reservation deja payee</h3>
                  <p className="muted-row">
                    Cette reservation a deja ete reglee. Vous pouvez retrouver son recu sur votre
                    tableau de bord.
                  </p>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => navigate(ROUTES.USER_DASHBOARD, { replace: true })}
                  >
                    Retour au tableau de bord
                  </button>
                </div>
              ) : (
                <form className="paiement-form" onSubmit={handleSubmit} noValidate>
                  <h3>Methode de paiement</h3>
                  <div className="paiement-methods">
                    {MODES.map((m) => (
                      <label
                        key={m.value}
                        className={`paiement-method${mode === m.value ? ' is-active' : ''}`}
                      >
                        <input
                          type="radio"
                          name="mode_paiement"
                          value={m.value}
                          checked={mode === m.value}
                          onChange={(event) => setMode(event.target.value)}
                        />
                        <span>{m.label}</span>
                      </label>
                    ))}
                  </div>

                  <p className="paiement-info muted-row">
                    {mode === 'especes'
                      ? "Paiement sur place : votre reservation sera enregistree mais restera en attente jusqu'a ce que vous regliez le montant a l'agence."
                      : 'Interface de paiement simulee : aucune transaction reelle n\'est effectuee. Le paiement est valide automatiquement et la reservation devient confirmee.'}
                  </p>

                  {formError && <p className="error-box">{formError}</p>}

                  <button
                    type="submit"
                    className="primary-btn paiement-submit"
                    disabled={submitting || totalAmount <= 0}
                  >
                    {submitting
                      ? 'Traitement...'
                      : mode === 'especes'
                      ? 'Reserver et payer sur place'
                      : `Payer ${totalAmount.toFixed(2)} DT`}
                  </button>

                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => navigate(ROUTES.USER_DASHBOARD, { replace: true })}
                    disabled={submitting}
                  >
                    Annuler et retourner au tableau de bord
                  </button>
                </form>
              )}
            </section>
          </div>
        )}

        <ToastStack toasts={toasts} onDismiss={dismiss} />
      </div>
    </Layout>
  );
}
