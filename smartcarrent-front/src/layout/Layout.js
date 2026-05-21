import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import NotificationBell from '../components/NotificationBell';
import { ROUTES } from '../routes/paths';

export default function Layout({ children }) {
  const { isAuthenticated, isAdmin, isUtilisateur, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate(ROUTES.HOME);
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <Link to={ROUTES.HOME} className="brand">
          SmartCarRent
        </Link>
        <nav className="topbar-links">
          <Link to={ROUTES.HOME}>Accueil</Link>
          {isUtilisateur && <Link to={ROUTES.USER_DASHBOARD}>Mon dashboard</Link>}
          {isAdmin && <Link to={ROUTES.ADMIN_DASHBOARD}>Admin</Link>}
          {!isAuthenticated && <Link to={ROUTES.LOGIN}>Login</Link>}
          {!isAuthenticated && <Link to={ROUTES.REGISTER}>Creer compte</Link>}
          {isAuthenticated && <NotificationBell align="right" />}
          {isAuthenticated && (
            <button type="button" className="ghost-btn" onClick={handleLogout}>
              Logout
            </button>
          )}
        </nav>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
