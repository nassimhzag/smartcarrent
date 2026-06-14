import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROUTES } from '../routes/paths';

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5l8.5 7 8.5-7" />
    </svg>
  );
}

function IconCard() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.5" />
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

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    permis_conduire: '',
    telephone: '',
    adresse: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function getApiErrorMessage(requestError) {
    const apiData = requestError?.response?.data;
    const validationErrors = apiData?.errors || {};

    return (
      validationErrors.password?.[0] ||
      validationErrors.email?.[0] ||
      validationErrors.permis_conduire?.[0] ||
      validationErrors.password_confirmation?.[0] ||
      apiData?.message ||
      'Echec de creation du compte. Verifiez les informations.'
    );
  }

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const response = await register(form);
      // Verification email obligatoire : on amene l'utilisateur sur la page
      // de saisie du code OTP, avec son email pre-transmis.
      if (response?.verification_required) {
        navigate(ROUTES.VERIFY_OTP, {
          replace: true,
          state: {
            email: response.email || form.email,
            expiresAt: response.expires_at || null,
          },
        });
        return;
      }
      navigate(ROUTES.HOME, { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
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
        <section className="auth-card auth-card-wide" aria-labelledby="register-title">
          <header className="auth-head">
            <h2 id="register-title">Creer un compte ✨</h2>
            <p>Rejoignez SmartCarRent en moins d'une minute.</p>
          </header>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <label className="auth-field">
              <span className="auth-field-label">Nom complet</span>
              <span className="auth-field-control">
                <span className="auth-field-icon" aria-hidden="true">
                  <IconUser />
                </span>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Votre nom et prenom"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                />
              </span>
            </label>

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
                  onChange={(event) => updateField('email', event.target.value)}
                />
              </span>
            </label>

            <div className="auth-grid-2">
              <label className="auth-field">
                <span className="auth-field-label">Permis de conduire</span>
                <span className="auth-field-control">
                  <span className="auth-field-icon" aria-hidden="true">
                    <IconCard />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="N° permis"
                    value={form.permis_conduire}
                    onChange={(event) => updateField('permis_conduire', event.target.value)}
                  />
                </span>
              </label>

              <label className="auth-field">
                <span className="auth-field-label">Telephone</span>
                <span className="auth-field-control">
                  <span className="auth-field-icon" aria-hidden="true">
                    <IconPhone />
                  </span>
                  <input
                    type="tel"
                    autoComplete="tel"
                    placeholder="+216 ..."
                    value={form.telephone}
                    onChange={(event) => updateField('telephone', event.target.value)}
                  />
                </span>
              </label>
            </div>

            <label className="auth-field">
              <span className="auth-field-label">Adresse</span>
              <span className="auth-field-control">
                <span className="auth-field-icon" aria-hidden="true">
                  <IconPin />
                </span>
                <input
                  type="text"
                  required
                  autoComplete="street-address"
                  placeholder="Rue, ville, code postal"
                  value={form.adresse}
                  onChange={(event) => updateField('adresse', event.target.value)}
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
                  autoComplete="new-password"
                  placeholder="Au moins 8 caracteres"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                />
                <button
                  type="button"
                  className="auth-pwd-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={showPassword}
                >
                  <IconEye open={showPassword} />
                </button>
              </span>
            </label>

            <label className="auth-field">
              <span className="auth-field-label">Confirmation du mot de passe</span>
              <span className="auth-field-control">
                <span className="auth-field-icon" aria-hidden="true">
                  <IconLock />
                </span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Repetez le mot de passe"
                  value={form.password_confirmation}
                  onChange={(event) => updateField('password_confirmation', event.target.value)}
                />
                <button
                  type="button"
                  className="auth-pwd-toggle"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  aria-label={
                    showConfirm ? 'Masquer la confirmation' : 'Afficher la confirmation'
                  }
                  aria-pressed={showConfirm}
                >
                  <IconEye open={showConfirm} />
                </button>
              </span>
            </label>

            {error && (
              <p className="error-box" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="auth-submit" disabled={busy}>
              {busy ? 'Creation...' : 'Creer mon compte'}
            </button>
          </form>

          <p className="auth-footer">
            Deja inscrit ? <Link to={ROUTES.LOGIN}>Se connecter</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
