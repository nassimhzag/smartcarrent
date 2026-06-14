import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import useAdminDashboard from '../hooks/useAdminDashboard';
import AdminLayout from '../layout/AdminLayout';
import { ROUTES } from '../routes/paths';

/* =====================================================
   Dashboard administrateur premium avec 4 graphiques
   ===================================================== */

const STATUS_COLORS = {
  en_cours: '#10b981',
  terminee: '#3b82f6',
  annulee: '#e11d48',
  // Compat libelles historiques (avant migration des statuts).
  en_attente_paiement: '#f59e0b',
  confirmee: '#10b981',
};

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
      </svg>
    );
  }
  if (icon === 'users') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="3.4" />
        <path d="M3 19a6 6 0 0 1 12 0" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M15 19a4.5 4.5 0 0 1 6.5-4" />
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

function ChartPanel({ title, subtitle, children, isEmpty, emptyLabel }) {
  return (
    <article className="admindash-chart-card">
      <header className="admindash-chart-head">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </header>
      <div className="admindash-chart-body">
        {isEmpty ? (
          <div className="admindash-chart-empty">
            <span aria-hidden="true">📊</span>
            <p>{emptyLabel || 'Aucune donnée pour le moment'}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </article>
  );
}

export default function AdminDashboard() {
  const { stats, loading, error } = useAdminDashboard();

  const summary = stats?.summary || {};
  const revenueMonthly = stats?.revenue_monthly || [];
  const topVoitures = stats?.top_voitures || [];
  const statusBreakdown = stats?.status_breakdown || [];
  const reservationsDaily = stats?.reservations_daily || [];

  const totalStatus = statusBreakdown.reduce((s, x) => s + (x.count || 0), 0);

  const kpis = useMemo(
    () => [
      {
        label: 'Revenus',
        value: `${Number(summary.total_revenue || 0).toFixed(2)} DT`,
        tone: 'revenue',
        icon: 'cash',
        hint: 'Total paiements payés',
      },
      {
        label: 'Réservations',
        value: summary.total_reservations || 0,
        tone: 'teal',
        icon: 'check',
        hint: 'Tous statuts confondus',
      },
      {
        label: 'Voitures',
        value: summary.total_voitures || 0,
        tone: 'info',
        icon: 'car',
        hint: 'Catalogue total',
      },
      {
        label: 'Clients',
        value: summary.total_clients || 0,
        tone: 'ok',
        icon: 'users',
        hint: 'Comptes inscrits',
      },
      {
        label: 'En attente',
        value: summary.pending_reservations || 0,
        tone: 'amber',
        icon: 'pending',
        hint: 'Résa pas encore payées',
      },
    ],
    [summary]
  );

  const quickActions = useMemo(
    () => [
      {
        label: 'Réservations',
        count: summary.total_reservations || 0,
        description: 'Consulter et gérer les réservations clients.',
        to: ROUTES.ADMIN_RESERVATIONS,
        tone: 'teal',
      },
      {
        label: 'Paiements',
        count: summary.paid_paiements || 0,
        description: 'Suivi financier, remboursements.',
        to: ROUTES.ADMIN_PAIEMENTS,
        tone: 'rose',
      },
      {
        label: 'Catalogue',
        count: summary.total_voitures || 0,
        description: 'Modifier prix, statut, ajouter une voiture.',
        to: ROUTES.ADMIN_VOITURES,
        tone: 'info',
      },
    ],
    [summary]
  );

  return (
    <AdminLayout
      title="Tableau de bord"
      subtitle="Vue d'ensemble de l'activité SmartCarRent"
    >
      {error && <p className="error-box">{error}</p>}

      {/* ============ KPI CARDS ============ */}
      <section className="admin-stats">
        {kpis.map((card) => (
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

      {/* ============ CHARTS ============ */}
      <section className="admindash-charts">
        {/* Revenu mensuel — Area chart */}
        <ChartPanel
          title="Évolution du revenu mensuel"
          subtitle="6 derniers mois — paiements encaissés (DT)"
          isEmpty={!loading && revenueMonthly.every((m) => m.revenue === 0)}
          emptyLabel="Aucun revenu enregistré sur la période"
        >
          {!loading && (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueMonthly} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }}
                  formatter={(v) => [`${Number(v).toFixed(2)} DT`, 'Revenu']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        {/* Top 5 voitures — Bar horizontal */}
        <ChartPanel
          title="Top 5 voitures les plus réservées"
          subtitle="Réservations confirmées + terminées"
          isEmpty={!loading && topVoitures.length === 0}
          emptyLabel="Aucune voiture réservée pour le moment"
        >
          {!loading && topVoitures.length > 0 && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={topVoitures}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#0f172a' }}
                  axisLine={false}
                  tickLine={false}
                  width={130}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }}
                  formatter={(v) => [v, 'Réservations']}
                />
                <Bar dataKey="count" fill="#0d9488" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        {/* Répartition statuts — Pie chart (donut) */}
        <ChartPanel
          title="Répartition des réservations"
          subtitle={`Total : ${totalStatus} réservation${totalStatus > 1 ? 's' : ''}`}
          isEmpty={!loading && totalStatus === 0}
          emptyLabel="Aucune réservation enregistrée"
        >
          {!loading && totalStatus > 0 && (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusBreakdown.filter((s) => s.count > 0)}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {statusBreakdown
                    .filter((s) => s.count > 0)
                    .map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#94a3b8'} />
                    ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        {/* Réservations quotidiennes — Bar chart */}
        <ChartPanel
          title="Réservations créées (14 derniers jours)"
          subtitle="Suivi quotidien de la demande"
          isEmpty={!loading && reservationsDaily.every((d) => d.count === 0)}
          emptyLabel="Aucune réservation sur la période"
        >
          {!loading && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={reservationsDaily} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }}
                  formatter={(v) => [v, 'Réservations']}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>
      </section>

      {/* ============ QUICK ACTIONS ============ */}
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
