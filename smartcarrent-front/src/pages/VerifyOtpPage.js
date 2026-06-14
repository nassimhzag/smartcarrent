import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/errorUtils';
import { useAuth } from '../auth/AuthContext';
import { resendOtpRequest } from '../services/otpService';
import { ROUTES } from '../routes/paths';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;
const DEFAULT_TTL_SECONDS = 10 * 60;

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

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5l8.5 7 8.5-7" />
    </svg>
  );
}

function formatMmSs(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function ttlSecondsFromIso(iso, fallback = DEFAULT_TTL_SECONDS) {
  if (!iso) return fallback;
  try {
    const target = new Date(iso).getTime();
    const diff = Math.floor((target - Date.now()) / 1000);
    return Math.max(0, diff);
  } catch (e) {
    return fallback;
  }
}

export default function VerifyOtpPage() {
  const { verifyOtp, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const stateEmail = location.state?.email || '';
  const stateExpiresAt = location.state?.expiresAt || null;

  const [email] = useState(stateEmail);
  const [digits, setDigits] = useState(() => Array.from({ length: OTP_LENGTH }, () => ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(() => ttlSecondsFromIso(stateExpiresAt));
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resendBusy, setResendBusy] = useState(false);

  const inputsRef = useRef([]);

  // Si l'email n'a pas ete transmis (acces direct a /verify-otp), on renvoie au login.
  useEffect(() => {
    if (!email) {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [email, navigate]);

  // Si l'utilisateur est deja connecte, on l'envoie sur son dashboard.
  useEffect(() => {
    if (!isAuthenticated) return;
    navigate(isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.USER_DASHBOARD, { replace: true });
  }, [isAuthenticated, isAdmin, navigate]);

  // Focus sur la premiere case au montage.
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Compteur d'expiration du code (1 tick / seconde).
  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  // Compteur cooldown pour le bouton "Renvoyer".
  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const t = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const code = digits.join('');
  const expired = secondsLeft <= 0;
  const canResend = !resendBusy && resendCooldown <= 0;
  const canSubmit = !busy && !expired && code.length === OTP_LENGTH;

  /* ---------- Saisie ---------- */

  function setDigitAt(index, value) {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handleDigitChange(index, raw) {
    // On ne garde que le dernier chiffre tape (au cas ou le champ aurait deux caracteres).
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
    } else if (event.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  }

  function handlePaste(event) {
    const pasted = (event.clipboardData?.getData('text') || '')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    setDigits(() => {
      const next = Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] || '');
      return next;
    });
    const lastIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
    if (lastIndex >= 0) inputsRef.current[lastIndex]?.focus();
    setError('');
  }

  /* ---------- Soumission ---------- */

  async function handleSubmit(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const response = await verifyOtp({ email, code });
      setSuccess(response?.message || 'Compte verifie.');
      // Redirection en fonction du role retourne par l'API.
      const role = response?.user?.role;
      const redirect =
        response?.redirect_to ||
        (role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.USER_DASHBOARD);
      setTimeout(() => navigate(redirect, { replace: true }), 600);
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Code invalide. Veuillez reessayer.');
      setError(message);
      // Vide les cases pour faciliter une nouvelle saisie.
      setDigits(Array.from({ length: OTP_LENGTH }, () => ''));
      inputsRef.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  }

  /* ---------- Renvoi du code ---------- */

  async function handleResend() {
    if (!canResend) return;
    setResendBusy(true);
    setError('');
    setSuccess('');
    try {
      const response = await resendOtpRequest({ email });
      setSuccess(response?.message || 'Un nouveau code vient d\'etre envoye.');
      setSecondsLeft(ttlSecondsFromIso(response?.expires_at));
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setDigits(Array.from({ length: OTP_LENGTH }, () => ''));
      inputsRef.current[0]?.focus();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Impossible d\'envoyer un nouveau code pour le moment.'));
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
        <section className="auth-card otp-card" aria-labelledby="otp-title">
          <header className="auth-head otp-head">
            <span className="otp-icon" aria-hidden="true">
              <IconMail />
            </span>
            <h2 id="otp-title">Verification de votre email</h2>
            <p>
              Nous avons envoye un code a 6 chiffres a{' '}
              <strong>{email || 'votre adresse'}</strong>.
              <br />
              Saisissez-le ci-dessous pour activer votre compte.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="otp-form" noValidate>
            <div
              className="otp-inputs"
              role="group"
              aria-label="Code de verification a 6 chiffres"
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
                  disabled={busy || expired}
                />
              ))}
            </div>

            <div className="otp-meta">
              {expired ? (
                <span className="otp-meta-expired">
                  Code expire. Demandez un nouveau code pour continuer.
                </span>
              ) : (
                <span className="otp-meta-timer">
                  Code valable encore <strong>{formatMmSs(secondsLeft)}</strong>
                </span>
              )}
            </div>

            {error && (
              <p className="error-box" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="otp-success" role="status">
                {success}
              </p>
            )}

            <button type="submit" className="auth-submit" disabled={!canSubmit}>
              {busy ? 'Verification...' : 'Verifier le code'}
            </button>
          </form>

          <div className="otp-resend">
            <span>Vous n'avez pas recu le code ?</span>
            <button
              type="button"
              className="otp-resend-btn"
              onClick={handleResend}
              disabled={!canResend}
            >
              {resendBusy
                ? 'Envoi...'
                : resendCooldown > 0
                ? `Renvoyer dans ${resendCooldown}s`
                : 'Renvoyer le code'}
            </button>
          </div>

          <p className="auth-footer">
            Mauvaise adresse ?{' '}
            <Link to={ROUTES.REGISTER}>Recommencer l'inscription</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
