import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/errorUtils';
import { forgotPasswordRequest, resetPasswordRequest } from '../services/passwordService';
import { ROUTES } from '../routes/paths';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

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

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const stateEmail = location.state?.email || '';

  const [email] = useState(stateEmail);
  const [digits, setDigits] = useState(() => Array.from({ length: OTP_LENGTH }, () => ''));
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resendBusy, setResendBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  const inputsRef = useRef([]);

  // Si on arrive ici sans email (acces direct), retour a /forgot-password.
  useEffect(() => {
    if (!email) {
      navigate(ROUTES.FORGOT_PASSWORD, { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const t = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const code = digits.join('');
  const canSubmit = !busy && code.length === OTP_LENGTH && password.length >= 8 && password === confirmation;

  function setDigitAt(index, value) {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handleDigitChange(index, raw) {
    const cleaned = String(raw).replace(/\D/g, '').slice(-1);
    setDigitAt(index, cleaned);
    if (cleaned && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
    setError('');
  }

  function handleKeyDown(index, event) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(event) {
    const pasted = (event.clipboardData?.getData('text') || '')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    setDigits(Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] || ''));
    const lastIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
    if (lastIndex >= 0) inputsRef.current[lastIndex]?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      await resetPasswordRequest({
        email,
        code,
        password,
        password_confirmation: confirmation,
      });
      setSuccessMessage('Mot de passe reinitialise avec succes. Redirection vers la connexion...');
      setTimeout(() => navigate(ROUTES.LOGIN, { replace: true }), 1400);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Code invalide ou expire.'));
      setDigits(Array.from({ length: OTP_LENGTH }, () => ''));
      inputsRef.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    if (resendBusy || resendCooldown > 0) return;
    setResendBusy(true);
    setError('');
    setSuccessMessage('');
    try {
      await forgotPasswordRequest(email);
      setSuccessMessage('Un nouveau code vient d\'etre envoye.');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setDigits(Array.from({ length: OTP_LENGTH }, () => ''));
      inputsRef.current[0]?.focus();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Impossible d\'envoyer un nouveau code.'));
    } finally {
      setResendBusy(false);
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
        <section className="auth-card otp-card" aria-labelledby="reset-title">
          <header className="auth-head otp-head">
            <span className="otp-icon" aria-hidden="true">
              <IconShield />
            </span>
            <h2 id="reset-title">Reinitialiser votre mot de passe</h2>
            <p>
              Saisissez le code a 6 chiffres recu a{' '}
              <strong>{email || 'votre adresse'}</strong>, puis choisissez un nouveau mot de passe.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="otp-form" noValidate>
            <div
              className="otp-inputs"
              role="group"
              aria-label="Code de reinitialisation a 6 chiffres"
            >
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  autoComplete="one-time-code"
                  className="otp-input"
                  aria-label={`Chiffre ${i + 1}`}
                  value={d}
                  onChange={(event) => handleDigitChange(i, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(i, event)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  disabled={busy}
                />
              ))}
            </div>

            <label className="auth-field">
              <span className="auth-field-label">Nouveau mot de passe</span>
              <span className="auth-field-control">
                <span className="auth-field-icon" aria-hidden="true">
                  <IconLock />
                </span>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Au moins 8 caracteres"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                />
              </span>
            </label>

            <label className="auth-field">
              <span className="auth-field-label">Confirmation</span>
              <span className="auth-field-control">
                <span className="auth-field-icon" aria-hidden="true">
                  <IconLock />
                </span>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Repetez le nouveau mot de passe"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  minLength={8}
                />
              </span>
            </label>

            {confirmation && confirmation !== password && (
              <p className="error-box" role="alert" style={{ margin: 0 }}>
                Les deux mots de passe ne correspondent pas.
              </p>
            )}

            {error && (
              <p className="error-box" role="alert">
                {error}
              </p>
            )}
            {successMessage && (
              <p className="otp-success" role="status">
                {successMessage}
              </p>
            )}

            <button type="submit" className="auth-submit" disabled={!canSubmit}>
              {busy ? 'Reinitialisation...' : 'Reinitialiser mon mot de passe'}
            </button>
          </form>

          <div className="otp-resend">
            <span>Vous n'avez pas recu le code ?</span>
            <button
              type="button"
              className="otp-resend-btn"
              onClick={handleResend}
              disabled={resendBusy || resendCooldown > 0}
            >
              {resendBusy
                ? 'Envoi...'
                : resendCooldown > 0
                ? `Renvoyer dans ${resendCooldown}s`
                : 'Renvoyer le code'}
            </button>
          </div>

          <p className="auth-footer">
            <Link to={ROUTES.LOGIN}>← Retour a la connexion</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
