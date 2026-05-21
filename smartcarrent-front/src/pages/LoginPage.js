import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../api/errorUtils';
import { useAuth } from '../auth/AuthContext';
import { ROUTES } from '../routes/paths';

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5l8.5 7 8.5-7" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function IconEye({ open }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 6.2A10 10 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.1 3.7" />
      <path d="M6.3 7.4A16 16 0 0 0 2 12s3.5 6 10 6a9.7 9.7 0 0 0 4.3-1" />
      <path d="M9.5 9.7A3 3 0 0 0 12 15a3 3 0 0 0 2.3-1.1" />
    </svg>
  );
}

function IconBrand() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 13.5l1.6-4.6A2 2 0 0 1 7 7.5h10a2 2 0 0 1 1.9 1.4l1.6 4.6" />
      <path d="M3 13.5h18v4a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 17 17.5V17H7v.5A1.5 1.5 0 0 1 5.5 19h-1A1.5 1.5 0 0 1 3 17.5z" />
      <circle cx="7.5" cy="15.5" r="1" />
      <circle cx="16.5" cy="15.5" r="1" />
    </svg>
  );
}

export default function LoginPage() {
  const { login, isAuthenticated, isAdmin, isUtilisateur } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const nextPath = searchParams.get('next') || '';

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (isAdmin) {
      navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
      return;
    }

    if (isUtilisateur && nextPath) {
      navigate(nextPath, { replace: true });
      return;
    }

    if (isUtilisateur) {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [isAuthenticated, isAdmin, isUtilisateur, navigate, nextPath]);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const response = await login(form);
      const role = response?.user?.role;

      if (role === 'admin') {
        navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
        return;
      }

      if (nextPath) {
        navigate(nextPath, { replace: true });
        return;
      }

      navigate(ROUTES.HOME, { replace: true });
    } catch (requestError) {
      const apiMessage = getApiErrorMessage(
        requestError,
        'Echec de connexion. Verifiez vos identifiants.'
      );
      setError(apiMessage);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <Link to={ROUTES.HOME} className="auth-corner-brand">
        <span className="auth-corner-brand-mark">
          <IconBrand />
        </span>
        <span className="auth-corner-brand-text">SmartCarRent</span>
      </Link>

      <main className="auth-center">
        <section className="auth-card" aria-labelledby="login-title">
          <header className="auth-head">
            <h2 id="login-title">Bon retour 👋</h2>
            <p>Connectez-vous pour gerer vos reservations.</p>
          </header>

          {nextPath.includes('reservation') && (
            <p className="auth-notice" role="status">
              Connectez-vous pour continuer votre reservation.
            </p>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <label className="auth-field">
              <span className="auth-field-label">Email</span>
              <span className="auth-field-control">
                <span className="auth-field-icon" aria-hidden="true">
                  <IconMail />
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
              </span>
            </label>

            <label className="auth-field">
              <span className="auth-field-label">Mot de passe</span>
              <span className="auth-field-control">
                <span className="auth-field-icon" aria-hidden="true">
                  <IconLock />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                />
                <button
                  type="button"
                  className="auth-pwd-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                  }
                  aria-pressed={showPassword}
                >
                  <IconEye open={showPassword} />
                </button>
              </span>
            </label>

            <div className="auth-row auth-row-end">
              <Link to="#" className="auth-link" aria-disabled="true">
                Mot de passe oublie ?
              </Link>
            </div>

            {error && (
              <p className="error-box" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="auth-submit" disabled={busy}>
              {busy ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="auth-footer">
            Pas encore de compte ? <Link to={ROUTES.REGISTER}>Creer un compte</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
