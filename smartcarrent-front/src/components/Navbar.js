import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import NotificationBell from './NotificationBell';
import { ROUTES } from '../routes/paths';

/* =========================================================
   Navbar premium SmartCarRent
   - sticky + backdrop blur + border subtile
   - menu central avec pill active
   - actions : favoris (visuel), notifications, avatar, logout
   - responsive : hamburger + drawer mobile
   ========================================================= */

/* ---------- Icones ---------- */
function IconCar() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 13.5l1.6-4.6A2 2 0 0 1 7 7.5h10a2 2 0 0 1 1.9 1.4l1.6 4.6" />
      <path d="M3 13.5h18v4a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 17 17.5V17H7v.5A1.5 1.5 0 0 1 5.5 19h-1A1.5 1.5 0 0 1 3 17.5z" />
      <circle cx="7.5" cy="15.5" r="1" />
      <circle cx="16.5" cy="15.5" r="1" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20.5l-1.4-1.3C5.4 14.5 2 11.4 2 7.6 2 4.9 4.1 3 6.7 3c1.7 0 3.4.9 4.3 2.3h2C13.9 3.9 15.6 3 17.3 3 19.9 3 22 4.9 22 7.6c0 3.8-3.4 6.9-8.6 11.6z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 17l-5-5 5-5" />
      <path d="M5 12h11" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/* ---------- Helpers ---------- */
function getInitials(name) {
  if (!name) return 'U';
  const parts = String(name).trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p[0] || '').join('');
  return initials.toUpperCase() || 'U';
}

export default function Navbar() {
  const { isAuthenticated, isAdmin, isUtilisateur, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* Ombre + fond plus opaque au scroll */
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* Ferme le drawer a chaque changement de page */
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  /* Ferme le drawer avec la touche ESC */
  useEffect(() => {
    if (!mobileOpen) return undefined;
    function handleKey(event) {
      if (event.key === 'Escape') setMobileOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mobileOpen]);

  async function handleLogout() {
    setMobileOpen(false);
    await logout();
    navigate(ROUTES.HOME);
  }

  /* "Accueil" : retour en haut de la home */
  function handleAccueil() {
    setMobileOpen(false);
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /* Etats actifs (pill) — calcules a partir de location.pathname */
  const voituresActive = location.pathname === ROUTES.VOITURES;
  const accueilActive = location.pathname === '/' && !voituresActive;
  const reservationsActive = location.pathname.startsWith('/dashboard');
  const adminActive = location.pathname.startsWith('/admin');

  const displayName = user?.name || 'Utilisateur';
  // L'avatar amene vers le profil pour un utilisateur, et vers le dashboard pour un admin.
  const avatarTarget = isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.PROFILE;

  /* Liens du menu central — reutilises en desktop et dans le drawer */
  function renderMenu() {
    return (
      <>
        <Link
          to={ROUTES.HOME}
          className={`nav-link${accueilActive ? ' is-active' : ''}`}
          aria-current={accueilActive ? 'page' : undefined}
          onClick={handleAccueil}
        >
          Accueil
        </Link>

        <Link
          to={ROUTES.VOITURES}
          className={`nav-link${voituresActive ? ' is-active' : ''}`}
          aria-current={voituresActive ? 'page' : undefined}
          onClick={() => setMobileOpen(false)}
        >
          Voitures
        </Link>

        {isUtilisateur && (
          <Link
            to={ROUTES.USER_DASHBOARD}
            className={`nav-link${reservationsActive ? ' is-active' : ''}`}
            aria-current={reservationsActive ? 'page' : undefined}
            onClick={() => setMobileOpen(false)}
          >
            Réservations
          </Link>
        )}

        {isAdmin && (
          <Link
            to={ROUTES.ADMIN_DASHBOARD}
            className={`nav-link${adminActive ? ' is-active' : ''}`}
            aria-current={adminActive ? 'page' : undefined}
            onClick={() => setMobileOpen(false)}
          >
            Admin
          </Link>
        )}
      </>
    );
  }

  return (
    <header className={`nav${scrolled ? ' is-scrolled' : ''}`}>
      <div className="nav-inner">
        {/* ---------- Gauche : marque ---------- */}
        <Link to={ROUTES.HOME} className="nav-brand" onClick={handleAccueil}>
          <span className="nav-brand-logo" aria-hidden="true">
            <IconCar />
          </span>
          <span className="nav-brand-name">
            Smart<span>CarRent</span>
          </span>
        </Link>

        {/* ---------- Centre : menu (desktop) ---------- */}
        <nav className="nav-menu" aria-label="Navigation principale">
          {renderMenu()}
        </nav>

        {/* ---------- Droite : actions (desktop) ---------- */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <button
                type="button"
                className="nav-icon-btn nav-fav"
                aria-label="Favoris (bientôt disponible)"
                title="Favoris — bientôt disponible"
              >
                <IconHeart />
                <span className="nav-badge" aria-hidden="true">1</span>
              </button>

              <NotificationBell align="right" />

              <Link
                to={avatarTarget}
                className="nav-avatar"
                title={displayName}
                aria-label={`Mon espace — ${displayName}`}
              >
                {getInitials(displayName)}
              </Link>

              <button type="button" className="nav-logout" onClick={handleLogout}>
                <IconLogout />
                <span>Déconnexion</span>
              </button>
            </>
          ) : (
            <>
              <Link to={ROUTES.LOGIN} className="nav-btn nav-btn-ghost">
                Connexion
              </Link>
              <Link to={ROUTES.REGISTER} className="nav-btn nav-btn-solid">
                Inscription
              </Link>
            </>
          )}
        </div>

        {/* ---------- Mobile : actions compactes ---------- */}
        <div className="nav-mobile-actions">
          {isAuthenticated && <NotificationBell align="right" />}
          <button
            type="button"
            className="nav-burger"
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileOpen}
            aria-controls="nav-drawer"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {/* ---------- Drawer mobile ---------- */}
      {mobileOpen && (
        <>
          <div
            className="nav-drawer-backdrop"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />
          <div className="nav-drawer" id="nav-drawer" role="dialog" aria-label="Menu">
            <nav className="nav-drawer-menu" aria-label="Navigation mobile">
              {renderMenu()}
            </nav>

            <div className="nav-drawer-actions">
              {isAuthenticated ? (
                <>
                  <div className="nav-drawer-user">
                    <span className="nav-avatar" aria-hidden="true">
                      {getInitials(displayName)}
                    </span>
                    <div>
                      <strong>{displayName}</strong>
                      <span>{user?.email}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="nav-drawer-link nav-drawer-fav"
                    aria-label="Favoris (bientôt disponible)"
                    title="Favoris — bientôt disponible"
                  >
                    <IconHeart />
                    <span>Favoris</span>
                    <span className="nav-badge" aria-hidden="true">1</span>
                  </button>

                  <button
                    type="button"
                    className="nav-drawer-link nav-drawer-logout"
                    onClick={handleLogout}
                  >
                    <IconLogout />
                    <span>Déconnexion</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to={ROUTES.LOGIN} className="nav-btn nav-btn-ghost nav-btn-wide">
                    Connexion
                  </Link>
                  <Link to={ROUTES.REGISTER} className="nav-btn nav-btn-solid nav-btn-wide">
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
