import { useMemo } from 'react';
import useReservations from '../hooks/useReservations';
import Layout from '../layout/Layout';

function statutLabel(statut) {
  if (statut === 'en_attente_paiement') return 'En attente paiement';
  if (statut === 'confirmee') return 'Confirmee';
  if (statut === 'annulee') return 'Annulee';
  if (statut === 'terminee') return 'Terminee';
  return statut || '—';
}

function statutBadgeClass(statut) {
  if (statut === 'en_attente_paiement') return 'badge badge-warn';
  if (statut === 'confirmee') return 'badge badge-ok';
  if (statut === 'annulee') return 'badge badge-danger';
  if (statut === 'terminee') return 'badge badge-info';
  return 'badge';
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

export default function UserDashboard() {
  const historyParams = useMemo(() => ({ per_page: 10 }), []);
  const { reservations, loading, error } = useReservations(historyParams);

  return (
    <Layout>
      <section className="panel">
        <h2>Mon dashboard</h2>
        <p>Historique de vos reservations</p>
        {loading && <p>Chargement de l'historique...</p>}
        {error && <p className="error-box">{error}</p>}
        {!loading &&
          reservations.map((reservation) => (
            <article className="line-item" key={reservation.id}>
              <strong>#{reservation.id}</strong>
              <span className={statutBadgeClass(reservation.statut)}>
                {statutLabel(reservation.statut)}
              </span>
              <span>
                {formatDate(reservation.date_debut)} au {formatDate(reservation.date_fin)}
              </span>
              {reservation.statut === 'en_attente_paiement' && (
                <span className="muted-row" style={{ fontSize: '0.85rem' }}>
                  Paiement sur place — venez a l'agence pour confirmer.
                </span>
              )}
            </article>
          ))}
        {!loading && reservations.length === 0 && <p>Aucune reservation pour le moment.</p>}
      </section>
    </Layout>
  );
}
