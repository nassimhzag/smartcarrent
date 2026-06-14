import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import NotificationBell from '../components/NotificationBell';
import { ROUTES } from '../routes/paths';

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7.5" height="9" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="5" rx="1.5" />
      <rect x="13.5" y="12" width="7.5" height="9" rx="1.5" />
      <rect x="3" y="16" width="7.5" height="5" rx="1.5" />
    </svg>
  );
}

function IconCar() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 13.5l1.6-4.6A2 2 0 0 1 7 7.5h10a2 2 0 0 1 1.9 1.4l1.6 4.6" />
      <path d="M3 13.5h18v4a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 17 17.5V17H7v.5A1.5 1.5 0 0 1 5.5 19h-1A1.5 1.5 0 0 1 3 17.5z" />
      <circle cx="7.5" cy="15.5" r="1" />
      <circle cx="16.5" cy="15.5" r="1" />
    </svg>
  );
}

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.4" />
      <path d="M3 19a6 6 0 0 1 12 0" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15 19a4.5 4.5 0 0 1 6.5-4" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9h17" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}

function IconWallet() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v.5" />
      <path d="M3 7.5V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3h-4.5a2 2 0 0 1 0-4H21V9a2 2 0 0 0-2-2H5.5A2.5 2.5 0 0 1 3 7.5z" />
      <circle cx="16.5" cy="13" r="0.9" fill="currentColor" />
    </svg>
  );
}

function IconTag() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0l-7-7a1.8 1.8 0 0 1-.5-1.3V5a2 2 0 0 1 2-2h7.3c.5 0 .9.2 1.3.5l6.9 6.9a2 2 0 0 1 0 2.8z" />
      <circle cx="8.5" cy="8.5" r="1.4" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 17l-5-5 5-5" />
      <path d="M5 12h11" />
    </svg>
  );
}

function getInitials(name) {
  if (!name) return 'A';
  const parts = String(name).trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'A';
}

export default function AdminLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate(ROUTES.HOME);
  }

  const displayName = user?.name || 'Admin';

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark">SC</span>
          <div className="admin-brand-text">
            <strong>SmartCarRent</strong>
            <span>Espace admin</span>
          </div>
        </div>

        <nav className="admin-nav">
          <p className="admin-nav-section">Pilotage</p>
          <NavLink
            to={ROUTES.ADMIN_DASHBOARD}
            end
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' is-active' : '')}
          >
            <IconDashboard />
            <span>Tableau de bord</span>
          </NavLink>

          <NavLink
            to={ROUTES.ADMIN_VOITURES}
            end
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' is-active' : '')}
          >
            <IconCar />
            <span>Gestion voitures</span>
          </NavLink>

          <NavLink
            to={ROUTES.ADMIN_MARQUES}
            end
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' is-active' : '')}
          >
            <IconTag />
            <span>Gestion marques</span>
          </NavLink>

          <NavLink
            to={ROUTES.ADMIN_RESERVATIONS}
            end
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' is-active' : '')}
          >
            <IconCalendar />
            <span>Reservations</span>
          </NavLink>

          <NavLink
            to={ROUTES.ADMIN_CLIENTS}
            end
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' is-active' : '')}
          >
            <IconUsers />
            <span>Clients</span>
          </NavLink>

          <NavLink
            to={ROUTES.ADMIN_PAIEMENTS}
            end
            className={({ isActive }) => 'admin-nav-link' + (isActive ? ' is-active' : '')}
          >
            <IconWallet />
            <span>Paiements</span>
          </NavLink>

          <p className="admin-nav-section">Site</p>
          <NavLink to={ROUTES.HOME} end className="admin-nav-link">
            <IconHome />
            <span>Voir le site</span>
          </NavLink>
        </nav>

        <button type="button" className="admin-nav-logout" onClick={handleLogout}>
          <IconLogout />
          <span>Deconnexion</span>
        </button>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-titles">
            <p className="admin-topbar-kicker">Admin</p>
            <h1>{title || 'Tableau de bord'}</h1>
            {subtitle && <p className="admin-topbar-sub">{subtitle}</p>}
          </div>
          <div className="admin-topbar-right">
            <NotificationBell align="right" />
            <div className="admin-userbox">
              <div className="admin-avatar">{getInitials(displayName)}</div>
              <div className="admin-userbox-text">
                <strong>{displayName}</strong>
                <span>{user?.email}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
