import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import useAdminStats from '../hooks/useAdminStats';
import AdminLayout from '../layout/AdminLayout';
import { useAuth } from '../auth/AuthContext';
import { ROUTES } from '../routes/paths';

function StatIcon({ icon }) {
  if (icon === 'car') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 13.5l1.6-4.6A2 2 0 0 1 7 7.5h10a2 2 0 0 1 1.9 1.4l1.6 4.6" />
        <path d="M3 13.5h18v4a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 17 17.5V17H7v.5A1.5 1.5 0 0 1 5.5 19h-1A1.5 1.5 0 0 1 3 17.5z" />
        <circle cx="7.5" cy="15.5" r="1" />
        <circle cx="16.5" cy="15.5" r="1" />
      </svg>
    );
  }
  if (icon === 'pending') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  if (icon === 'check') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.5l3 3 5-6" />
      </svg>
    );
  }
  if (icon === 'wallet') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v.5" />
        <path d="M3 7.5V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3h-4.5a2 2 0 0 1 0-4H21V9a2 2 0 0 0-2-2H5.5A2.5 2.5 0 0 1 3 7.5z" />
        <circle cx="16.5" cy="13" r="0.9" fill="currentColor" />
      </svg>
    );
  }
  if (icon === 'cash') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M6 9h0M18 15h0" />
      </svg>
    );
  }
  if (icon === 'arrow') {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
        <path d="M13 5l7 7-7 7" />
      </svg>
    );
  }
  return null;
}

export default function AdminDashboard() {
  const { stats, loading, error } = useAdminStats();
  const { user } = useAuth();

  const cards = useMemo(
    () => [
      {
        label: 'Voitures',
        value: stats.voitures,
        tone: 'teal',
        icon: 'car',
        hint: 'Catalogue total',
      },
      {
        label: 'En attente paiement',
        value: stats.reservationsEnAttente,
        tone: 'amber',
        icon: 'pending',
        hint: 'Resa pas encore payees',
      },
      {
        label: 'Resa confirmees',
        value: stats.reservationsConfirmees,
        tone: 'ok',
        icon: 'check',
        hint: 'Locations actives',
      },
      {
        label: 'Paiements en attente',
        value: stats.paiementsEnAttente,
        tone: 'rose',
        icon: 'wallet',
        hint: 'A valider',
      },
      {
        label: 'Revenus',
        value: `${Number(stats.revenus || 0).toFixed(2)} DT`,
        tone: 'revenue',
        icon: 'cash',
        hint: 'Paiements payes',
        isMoney: true,
      },
    ],
    [stats]
  );

  const quickActions = useMemo(
    () => [
      {
        label: 'Resa en attente paiement',
        count: stats.reservationsEnAttente,
        description: 'Reservations creees mais pas encore payees par le client.',
        to: ROUTES.ADMIN_RESERVATIONS,
        tone: 'amber',
      },
      {
        label: 'Paiements a valider',
        count: stats.paiementsEnAttente,
        description: 'Verifier puis valider ou rembourser.',
        to: ROUTES.ADMIN_PAIEMENTS,
        tone: 'rose',
      },
      {
        label: 'Calendrier',
        count: stats.reservationsConfirmees,
        description: 'Voir les locations actives et bloquer une voiture.',
        to: ROUTES.ADMIN_CALENDRIERS,
        tone: 'teal',
      },
      {
        label: 'Catalogue voitures',
        count: stats.voitures,
        description: 'Modifier prix, statut, ajouter une voiture.',
        to: ROUTES.ADMIN_VOITURES,
        tone: 'info',
      },
    ],
    [stats]
  );

  const firstName = (user?.name || 'admin').split(/\s+/)[0];

  return (
    <AdminLayout title="Tableau de bord" subtitle="Vue d'ensemble de l'activite">
      <section className="admin-hero">
        <p className="admin-hero-kicker">SmartCarRent · Pilotage</p>
        <h2>Bonjour {firstName} 👋</h2>
        <p>Suivez l'activite du site en un coup d'oeil — voitures, reservations et paiements.</p>
      </section>

      {error && <p className="error-box">{error}</p>}

      <section className="admin-stats">
        {cards.map((card) => (
          <article key={card.label} className={`admin-stat tone-${card.tone}`}>
            <span className="admin-stat-icon">
              <StatIcon icon={card.icon} />
            </span>
            <div className="admin-stat-body">
              <p className="admin-stat-label">{card.label}</p>
              <strong className="admin-stat-value">{loading ? '…' : card.value}</strong>
              <span className="admin-stat-hint">{card.hint}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-quick-section">
        <header className="admin-panel-head" style={{ marginBottom: 12 }}>
          <h3>Actions rapides</h3>
          <span className="admin-tag">Navigation</span>
        </header>

        <div className="admin-quick-grid">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className={`admin-quick-card tone-${action.tone}`}
            >
              <div className="admin-quick-card-head">
                <span className="admin-quick-count">
                  {loading ? '…' : action.count ?? 0}
                </span>
                <span className="admin-quick-arrow" aria-hidden="true">
                  <StatIcon icon="arrow" />
                </span>
              </div>
              <strong className="admin-quick-title">{action.label}</strong>
              <span className="admin-quick-desc">{action.description}</span>
            </Link>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}
