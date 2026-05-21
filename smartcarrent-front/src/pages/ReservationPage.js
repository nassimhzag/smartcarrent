import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../layout/Layout';
import useToast from '../hooks/useToast';
import { ToastStack } from '../components/Toast';
import StepBar from '../components/StepBar';
import { createReservation } from '../services/reservationService';
import { payReservation } from '../services/paiementService';
import { getVoitureById } from '../services/voitureService';
import { ROUTES, toReservationNew } from '../routes/paths';
import { getApiErrorMessage } from '../api/errorUtils';

const MODES = [
  { value: 'carte', label: 'Carte bancaire', hint: 'Paiement immediat en ligne. Reservation confirmee automatiquement.' },
  { value: 'especes', label: 'Paiement sur place', hint: 'Reservation en attente. Vous reglez le montant a l\'agence.' },
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

export default function ReservationPage() {
  const { voitureId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toasts, success, error: toastError, dismiss } = useToast();

  // Dates eventuellement transmises depuis la Home Page (?debut=&fin=).
  const presetDebut = searchParams.get('debut') || '';
  const presetFin = searchParams.get('fin') || '';
  // True si les deux dates viennent de la recherche Home : on les affiche
  // alors en lecture seule et on masque les champs de saisie.
  const datesFromHome = Boolean(presetDebut && presetFin);

  const [voiture, setVoiture] = useState(null);
  const [loadingVoiture, setLoadingVoiture] = useState(true);
  const [form, setForm] = useState({
    date_debut: presetDebut,
    date_fin: presetFin,
    mode_paiement: 'carte',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Etape courante du processus (0: voiture choisie, 1: dates+paiement, 2: confirmation)
  const [currentStep, setCurrentStep] = useState(1);

  const RESERVATION_STEPS = [
    { label: 'Voiture choisie', description: 'Vehicule selectionne' },
    { label: 'Dates & paiement', description: 'Reservation en cours' },
    { label: 'Confirmation', description: 'Reservation finalisee' },
  ];

  useEffect(() => {
    let cancelled = false;
    async function loadVoiture() {
      try {
        setLoadingVoiture(true);
        const data = await getVoitureById(voitureId);
        if (!cancelled) setVoiture(data);
      } catch (e) {
        if (!cancelled) {
          setError("Impossible de charger les details de la voiture.");
        }
      } finally {
        if (!cancelled) setLoadingVoiture(false);
      }
    }
    if (voitureId) loadVoiture();
    return () => {
      cancelled = true;
    };
  }, [voitureId]);

  const days = useMemo(() => diffInDays(form.date_debut, form.date_fin), [form.date_debut, form.date_fin]);
  const dailyPrice = Number(voiture?.prix_par_jour || 0);
  const totalAmount = days * dailyPrice;
  const isCash = form.mode_paiement === 'especes';

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError('');

    try {
      // 1) Creer la reservation
      const reservation = await createReservation({
        voiture_id: Number(voitureId),
        date_debut: form.date_debut,
        date_fin: form.date_fin,
      });

      const reservationId = reservation?.id;
      if (!reservationId) {
        throw new Error("Reservation creee mais identifiant manquant.");
      }

      // 2) Creer le paiement avec la methode choisie. Le backend decide
      //    automatiquement : carte = paye + resa confirmee + email
      //                      especes = paiement en attente, resa en attente
      const today = new Date().toISOString().slice(0, 10);
      await payReservation({
        reservation_id: reservationId,
        montant: totalAmount,
        date_paiement: today,
        mode_paiement: form.mode_paiement,
      });

      // Etape finale atteinte : on met a jour la barre de progression.
      setCurrentStep(2);

      success(
        isCash
          ? 'Reservation enregistree. Venez payer sur place pour la confirmer.'
          : 'Paiement effectue. Reservation confirmee. Un email de confirmation vous a ete envoye.'
      );

      // Redirection legere
      setTimeout(() => navigate(ROUTES.USER_DASHBOARD, { replace: true }), 1400);
    } catch (requestError) {
      const message = getApiErrorMessage(
        requestError,
        'Impossible de reserver cette voiture. Verifiez les dates et la disponibilite.'
      );
      setError(message);
      toastError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <div className="paiement-shell">
        <header className="paiement-head">
          <p className="kicker">Nouvelle reservation</p>
          <h1>Reserver votre voiture</h1>
          <p className="muted-row">
            {datesFromHome
              ? 'Verifiez vos dates et choisissez votre methode de paiement. Vos coordonnees sont recuperees automatiquement depuis votre compte.'
              : 'Renseignez vos dates et choisissez votre methode de paiement. Vos coordonnees sont recuperees automatiquement depuis votre compte.'}
          </p>
        </header>

        <StepBar steps={RESERVATION_STEPS} current={currentStep} />

        {loadingVoiture && (
          <div className="admin-loading-row" style={{ padding: 22 }}>
            <span className="admin-spinner" aria-hidden="true" />
            <span>Chargement de la voiture...</span>
          </div>
        )}

        {voiture && !loadingVoiture && (
          <div className="paiement-grid">
            <section className="panel paiement-summary">
              <h3>Recapitulatif</h3>
              <ul className="paiement-summary-list">
                <li>
                  <span>Vehicule</span>
                  <strong>{voiture.modele || '—'}</strong>
                </li>
                <li>
                  <span>Immatriculation</span>
                  <strong>{voiture.immatriculation || '—'}</strong>
                </li>
                <li>
                  <span>Prix par jour</span>
                  <strong>{dailyPrice.toFixed(2)} DT</strong>
                </li>
                {form.date_debut && form.date_fin && (
                  <>
                    <li>
                      <span>Du</span>
                      <strong>{formatDate(form.date_debut)}</strong>
                    </li>
                    <li>
                      <span>Au</span>
                      <strong>{formatDate(form.date_fin)}</strong>
                    </li>
                    <li>
                      <span>Duree</span>
                      <strong>
                        {days} jour{days > 1 ? 's' : ''}
                      </strong>
                    </li>
                    <li className="paiement-summary-total">
                      <span>Montant total</span>
                      <strong>{totalAmount.toFixed(2)} DT</strong>
                    </li>
                  </>
                )}
              </ul>
            </section>

            <section className="panel paiement-form-panel">
              <form className="paiement-form" onSubmit={handleSubmit} noValidate>
                {datesFromHome ? (
                  /* Dates deja choisies depuis la Home Page : affichage en lecture seule */
                  <>
                    <h3>Vos dates de location</h3>
                    <div className="paiement-dates-readonly">
                      <div className="paiement-date-chip">
                        <span>Date debut</span>
                        <strong>{formatDate(form.date_debut)}</strong>
                      </div>
                      <div className="paiement-date-chip">
                        <span>Date fin</span>
                        <strong>{formatDate(form.date_fin)}</strong>
                      </div>
                    </div>
                    <p className="paiement-dates-note muted-row">
                      Dates issues de votre recherche.{' '}
                      <button
                        type="button"
                        className="paiement-link-btn"
                        onClick={() => navigate(toReservationNew(voitureId))}
                      >
                        Modifier
                      </button>
                    </p>
                  </>
                ) : (
                  /* Acces direct a la page reservation : saisie normale des dates */
                  <>
                    <h3>Vos dates de location</h3>
                    <div className="admin-form-grid" style={{ gap: 14 }}>
                      <label className="admin-form-field">
                        <span>Date debut</span>
                        <input
                          type="date"
                          required
                          value={form.date_debut}
                          onChange={(event) => setField('date_debut', event.target.value)}
                        />
                      </label>
                      <label className="admin-form-field">
                        <span>Date fin</span>
                        <input
                          type="date"
                          required
                          value={form.date_fin}
                          onChange={(event) => setField('date_fin', event.target.value)}
                        />
                      </label>
                    </div>
                  </>
                )}

                <h3 style={{ marginTop: 14 }}>Methode de paiement</h3>
                <div className="paiement-methods">
                  {MODES.map((m) => (
                    <label
                      key={m.value}
                      className={`paiement-method${form.mode_paiement === m.value ? ' is-active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="mode_paiement"
                        value={m.value}
                        checked={form.mode_paiement === m.value}
                        onChange={(event) => setField('mode_paiement', event.target.value)}
                      />
                      <span>
                        <strong style={{ display: 'block' }}>{m.label}</strong>
                        <small className="muted-row" style={{ fontWeight: 400 }}>
                          {m.hint}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>

                <p className="paiement-info muted-row">
                  Le permis de conduire (valide depuis au moins 2 ans) sera verifie a l'agence lors
                  du retrait du vehicule.
                </p>

                {error && <p className="error-box">{error}</p>}

                <button
                  type="submit"
                  className="primary-btn paiement-submit"
                  disabled={busy || totalAmount <= 0 || !form.date_debut || !form.date_fin}
                >
                  {busy
                    ? 'Traitement...'
                    : isCash
                    ? 'Reserver et payer sur place'
                    : `Payer ${totalAmount.toFixed(2)} DT`}
                </button>
              </form>
            </section>
          </div>
        )}

        <ToastStack toasts={toasts} onDismiss={dismiss} />
      </div>
    </Layout>
  );
}
