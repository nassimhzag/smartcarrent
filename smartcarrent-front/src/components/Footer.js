/**
 * Footer site SmartCarRent — pleine largeur (rendu par Layout sous le main).
 * Conserve le design moderne ; integre les coordonnees reelles du gerant
 * avec icones et liens cliquables (mailto / tel).
 */

const CONTACT_EMAIL = 'nassimhzag100@gmail.com';
// NOTE: remplace ici par ton vrai numero (format international Tunisie sans
// espaces dans href tel: pour respecter la norme RFC 3966).
const CONTACT_PHONE_DISPLAY = '+216 93 095 190';
const CONTACT_PHONE_TEL = '+21693095190';
const CONTACT_ADDRESS = 'Beb Bhar, Sfax, Tunisie';

/* ---------- Icones SVG (style identique au reste du site) ---------- */

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
         stroke="currentColor" strokeWidth="1.7"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
         stroke="currentColor" strokeWidth="1.7"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
         stroke="currentColor" strokeWidth="1.7"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
         stroke="currentColor" strokeWidth="1.7"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="home-footer">
      <div className="home-footer-inner">
        <div className="home-footer-grid">
          <div className="home-footer-brand">
            <div className="home-footer-logo">
              <span className="home-footer-logo-mark">SC</span>
              <strong>SmartCarRent</strong>
            </div>
            <p>
              Votre partenaire de confiance pour la location de voitures. Des vehicules
              verifies, des prix clairs et un service rapide.
            </p>
          </div>

          <div className="home-footer-col">
            <h4>Contact</h4>
            <ul className="home-footer-contact">
              <li>
                <span className="home-footer-contact-ico"><IconPin /></span>
                <span>{CONTACT_ADDRESS}</span>
              </li>
              <li>
                <span className="home-footer-contact-ico"><IconPhone /></span>
                <a href={`tel:${CONTACT_PHONE_TEL}`}>{CONTACT_PHONE_DISPLAY}</a>
              </li>
              <li>
                <span className="home-footer-contact-ico"><IconMail /></span>
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </li>
              <li>
                <span className="home-footer-contact-ico"><IconClock /></span>
                <span>Lun — Sam : 8h - 19h</span>
              </li>
            </ul>
          </div>

          <div className="home-footer-col">
            <h4>Liens rapides</h4>
            <ul>
              <li><a href="/">Accueil</a></li>
              <li><a href="/voitures">Catalogue</a></li>
              <li><a href="/login">Espace client</a></li>
            </ul>
          </div>

          <div className="home-footer-col">
            <h4>Suivez-nous</h4>
            <div className="home-footer-social">
              <a href="#facebook" aria-label="Facebook" onClick={(e) => e.preventDefault()}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M13 22v-9h3l.5-4H13V6.5c0-1.1.3-1.9 1.9-1.9H17V1.1C16.6 1 15.4 1 14.1 1 11.3 1 9.5 2.7 9.5 5.9V9H6.5v4h3v9H13z" />
                </svg>
              </a>
              <a href="#instagram" aria-label="Instagram" onClick={(e) => e.preventDefault()}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="#twitter" aria-label="Twitter" onClick={(e) => e.preventDefault()}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M22 5.8c-.7.3-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4 4 0 0 0-6.9 3.7A11.4 11.4 0 0 1 3.7 4.5a4 4 0 0 0 1.2 5.4c-.6 0-1.2-.2-1.8-.5v.1a4 4 0 0 0 3.2 4 4 4 0 0 1-1.8.1 4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 18a11.3 11.3 0 0 0 6.1 1.8c7.4 0 11.4-6.1 11.4-11.4v-.5c.8-.6 1.5-1.3 2-2.1z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="home-footer-bottom">
          © {new Date().getFullYear()} SmartCarRent. Tous droits reserves.
        </div>
      </div>
    </footer>
  );
}
