import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../api/errorUtils';
import { useAuth } from '../auth/AuthContext';
import { ToastStack } from '../components/Toast';
import useToast from '../hooks/useToast';
import Layout from '../layout/Layout';
import { changePasswordRequest, updateProfileRequest } from '../services/profileService';
import { storeUser } from '../api/client';

/* =====================================================
   Mon profil — édition des informations + mot de passe
   ===================================================== */

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
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

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5l8.5 7 8.5-7" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toasts, success, error: toastError, dismiss } = useToast();

  /* ---------- Form 1 : Informations personnelles ---------- */
  const [profileForm, setProfileForm] = useState({
    name: '',
    telephone: '',
    adresse: '',
  });
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      name: user.name || '',
      telephone: user.client?.telephone || '',
      adresse: user.client?.adresse || '',
    });
  }, [user]);

  function updateProfileField(key, value) {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setProfileBusy(true);
    setProfileError('');
    try {
      const response = await updateProfileRequest(profileForm);
      // Mettre a jour le user dans le local storage pour que la Navbar
      // refletera le nouveau nom au prochain refresh / re-bootstrap.
      if (response?.user) {
        storeUser(response.user);
      }
      success(response?.message || 'Profil mis à jour avec succès.');
    } catch (requestError) {
      const message = getApiErrorMessage(
        requestError,
        'Impossible de mettre à jour le profil.'
      );
      setProfileError(message);
      toastError(message);
    } finally {
      setProfileBusy(false);
    }
  }

  /* ---------- Form 2 : Mot de passe ---------- */
  const [pwdForm, setPwdForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdError, setPwdError] = useState('');

  function updatePwdField(key, value) {
    setPwdForm((prev) => ({ ...prev, [key]: value }));
  }

  const pwdMismatch =
    pwdForm.password_confirmation &&
    pwdForm.password_confirmation !== pwdForm.password;

  async function handlePwdSubmit(event) {
    event.preventDefault();
    if (pwdMismatch) return;
    setPwdBusy(true);
    setPwdError('');
    try {
      const response = await changePasswordRequest(pwdForm);
      success(response?.message || 'Mot de passe mis à jour avec succès.');
      setPwdForm({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
    } catch (requestError) {
      const message = getApiErrorMessage(
        requestError,
        'Impossible de changer le mot de passe.'
      );
      setPwdError(message);
      toastError(message);
    } finally {
      setPwdBusy(false);
    }
  }

  return (
    <Layout>
      <div className="profile-page">
        {/* ============ HERO ============ */}
        <section className="profile-hero">
          <div className="profile-hero-text">
            <span className="profile-hero-icon" aria-hidden="true">
              <IconUser />
            </span>
            <div>
              <h1>Mon profil</h1>
              <p>Gérez vos informations personnelles et la sécurité de votre compte.</p>
            </div>
          </div>
        </section>

        {/* ============ INFOS PERSONNELLES ============ */}
        <section className="profile-card">
          <header className="profile-card-head">
            <h2>Informations personnelles</h2>
            <p>Votre adresse email ne peut pas être modifiée ici. Contactez le support si besoin.</p>
          </header>

          <form onSubmit={handleProfileSubmit} className="auth-form" noValidate>
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
                  value={profileForm.name}
                  onChange={(event) => updateProfileField('name', event.target.value)}
                />
              </span>
            </label>

            <label className="auth-field">
              <span className="auth-field-label">Email (lecture seule)</span>
              <span className="auth-field-control">
                <span className="auth-field-icon" aria-hidden="true">
                  <IconMail />
                </span>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  aria-readonly="true"
                  style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                />
              </span>
            </label>

            <div className="auth-grid-2">
              <label className="auth-field">
                <span className="auth-field-label">Téléphone</span>
                <span className="auth-field-control">
                  <span className="auth-field-icon" aria-hidden="true">
                    <IconPhone />
                  </span>
                  <input
                    type="tel"
                    autoComplete="tel"
                    placeholder="+216 ..."
                    value={profileForm.telephone}
                    onChange={(event) => updateProfileField('telephone', event.target.value)}
                  />
                </span>
              </label>

              <label className="auth-field">
                <span className="auth-field-label">Adresse</span>
                <span className="auth-field-control">
                  <span className="auth-field-icon" aria-hidden="true">
                    <IconPin />
                  </span>
                  <input
                    type="text"
                    autoComplete="street-address"
                    placeholder="Rue, ville, code postal"
                    value={profileForm.adresse}
                    onChange={(event) => updateProfileField('adresse', event.target.value)}
                  />
                </span>
              </label>
            </div>

            {profileError && (
              <p className="error-box" role="alert">
                {profileError}
              </p>
            )}

            <button type="submit" className="auth-submit" disabled={profileBusy}>
              {profileBusy ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </form>
        </section>

        {/* ============ MOT DE PASSE ============ */}
        <section className="profile-card">
          <header className="profile-card-head">
            <h2>Changer le mot de passe</h2>
            <p>Saisissez votre mot de passe actuel puis votre nouveau mot de passe.</p>
          </header>

          <form onSubmit={handlePwdSubmit} className="auth-form" noValidate>
            <label className="auth-field">
              <span className="auth-field-label">Mot de passe actuel</span>
              <span className="auth-field-control">
                <span className="auth-field-icon" aria-hidden="true">
                  <IconLock />
                </span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={pwdForm.current_password}
                  onChange={(event) => updatePwdField('current_password', event.target.value)}
                />
              </span>
            </label>

            <div className="auth-grid-2">
              <label className="auth-field">
                <span className="auth-field-label">Nouveau mot de passe</span>
                <span className="auth-field-control">
                  <span className="auth-field-icon" aria-hidden="true">
                    <IconLock />
                  </span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Au moins 8 caractères"
                    value={pwdForm.password}
                    onChange={(event) => updatePwdField('password', event.target.value)}
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
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Répétez le nouveau mot de passe"
                    value={pwdForm.password_confirmation}
                    onChange={(event) =>
                      updatePwdField('password_confirmation', event.target.value)
                    }
                  />
                </span>
              </label>
            </div>

            {pwdMismatch && (
              <p className="error-box" role="alert" style={{ margin: 0 }}>
                Les deux mots de passe ne correspondent pas.
              </p>
            )}

            {pwdError && (
              <p className="error-box" role="alert">
                {pwdError}
              </p>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={pwdBusy || pwdMismatch || !pwdForm.password || !pwdForm.current_password}
            >
              {pwdBusy ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        </section>

        <ToastStack toasts={toasts} onDismiss={dismiss} />
      </div>
    </Layout>
  );
}
