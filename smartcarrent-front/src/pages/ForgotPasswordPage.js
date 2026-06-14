import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/errorUtils';
import { forgotPasswordRequest } from '../services/passwordService';
import { ROUTES } from '../routes/paths';

function IconBrand() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 13.5l1.6-4.6A2 2 0 0 1 7 7.5h10a2 2 0 0 1 1.9 1.4l1.6 4.6" />
      <path d="M3 13.5h18v4a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 17 17.5V17H7v.5A1.5 1.5 0 0 1 5.5 19h-1A1.5 1.5 0 0 1 3 17.5z" />
      <circle cx="7.5" cy="15.5" r="1" />
      <circle cx="16.5" cy="15.5" r="1" />
    </svg>
  );
}

function IconKey() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="15" r="4" />
      <path d="M10.8 12.2L20 3" />
      <path d="M16 7l3 3" />
      <path d="M14 9l3 3" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5l8.5 7 8.5-7" />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await forgotPasswordRequest(email);
      navigate(ROUTES.RESET_PASSWORD, {
        replace: true,
        state: { email: response.email || email },
      });
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'Impossible d\'envoyer le code pour le moment. Veuillez reessayer.'
        )
      );
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
        <section className="auth-card otp-card" aria-labelledby="forgot-title">
          <header className="auth-head otp-head">
            <span className="otp-icon" aria-hidden="true">
              <IconKey />
            </span>
            <h2 id="forgot-title">Mot de passe oublie ?</h2>
            <p>
              Saisissez votre adresse email ci-dessous. Si un compte est associe,
              nous vous enverrons un code de reinitialisation a 6 chiffres.
            </p>
          </header>

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
                  autoFocus
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </span>
            </label>

            {error && (
              <p className="error-box" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="auth-submit" disabled={busy || !email}>
              {busy ? 'Envoi en cours...' : 'Envoyer le code'}
            </button>
          </form>

          <p className="auth-footer">
            <Link to={ROUTES.LOGIN}>← Retour a la connexion</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
