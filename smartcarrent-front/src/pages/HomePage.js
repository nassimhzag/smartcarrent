import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import useVoitures from '../hooks/useVoitures';
import Layout from '../layout/Layout';
import {
  ROUTES,
  toCarDetail,
  toLoginWithNext,
  toReservationNew,
} from '../routes/paths';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80';

/* ----- Icones pour les sections premium ----- */
function FeatureIcon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    width: 24,
    height: 24,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  if (name === 'fast') {
    return (
      <svg {...common}>
        <path d="M13 2L4.5 13.5H11l-1 8.5L19 10h-6.5L13 2z" />
      </svg>
    );
  }
  if (name === 'secure') {
    return (
      <svg {...common}>
        <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  }
  if (name === 'realtime') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  if (name === 'support') {
    return (
      <svg {...common}>
        <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
        <path d="M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2z" />
        <path d="M20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2z" />
        <path d="M18 17v1a3 3 0 0 1-3 3h-3" />
      </svg>
    );
  }
  if (name === 'recent') {
    return (
      <svg {...common}>
        <path d="M3.5 13.5l1.6-4.6A2 2 0 0 1 7 7.5h10a2 2 0 0 1 1.9 1.4l1.6 4.6" />
        <path d="M3 13.5h18v4a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 17 17.5V17H7v.5A1.5 1.5 0 0 1 5.5 19h-1A1.5 1.5 0 0 1 3 17.5z" />
        <circle cx="7.5" cy="15.5" r="1" />
        <circle cx="16.5" cy="15.5" r="1" />
      </svg>
    );
  }
  if (name === 'choose') {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
    );
  }
  if (name === 'book') {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M4 9h16" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    );
  }
  if (name === 'key') {
    return (
      <svg {...common}>
        <circle cx="8" cy="15" r="4" />
        <path d="M10.8 12.2L20 3" />
        <path d="M16 7l3 3" />
        <path d="M14 9l3 3" />
      </svg>
    );
  }
  return null;
}

const WHY_FEATURES = [
  {
    icon: 'fast',
    tone: 'teal',
    title: 'Reservation rapide',
    text: 'Reservez votre voiture en quelques clics, sans paperasse inutile.',
  },
  {
    icon: 'secure',
    tone: 'blue',
    title: 'Paiement securise',
    text: 'Carte bancaire ou paiement sur place : vos transactions sont protegees.',
  },
  {
    icon: 'realtime',
    tone: 'amber',
    title: 'Disponibilite en temps reel',
    text: 'Le statut des voitures est mis a jour automatiquement selon les reservations.',
  },
  {
    icon: 'support',
    tone: 'rose',
    title: 'Support 24/7',
    text: 'Notre equipe reste joignable a tout moment pour vous accompagner.',
  },
  {
    icon: 'recent',
    tone: 'teal',
    title: 'Voitures recentes',
    text: 'Un parc automobile entretenu et regulierement renouvele.',
  },
];

const HOW_STEPS = [
  {
    icon: 'choose',
    title: 'Choisir une voiture',
    text: 'Parcourez le catalogue et selectionnez le vehicule qui vous convient.',
  },
  {
    icon: 'book',
    title: 'Reserver en ligne',
    text: 'Indiquez vos dates, choisissez votre mode de paiement et validez.',
  },
  {
    icon: 'key',
    title: 'Recuperer le vehicule',
    text: "Presentez-vous a l'agence avec votre permis et repartez au volant.",
  },
];

/* ----- Categories de voitures (alignees avec le backend) ----- */
const CAR_CATEGORIES = [
  {
    key: 'SUV',
    tagline: 'Espace & robustesse',
    image:
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=900&q=80',
  },
  {
    key: 'Berline',
    tagline: 'Confort & elegance',
    image:
      'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=900&q=80',
  },
  {
    key: 'Citadine',
    tagline: 'Agile en ville',
    image:
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=900&q=80',
  },
  {
    key: 'Luxe',
    tagline: 'Le haut de gamme',
    image:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
  },
  {
    key: 'Utilitaire',
    tagline: 'Volume & transport',
    image:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80',
  },
];

/* Remise appliquee aux "Offres du moment" (purement visuel cote front) */
const PROMO_RATE = 0.15;

function statutLabel(statut) {
  if (statut === 'disponible') return 'Disponible';
  if (statut === 'reservee') return 'Reservee';
  if (statut === 'maintenance') return 'Maintenance';
  return statut || '—';
}

function statutBadgeClass(statut) {
  if (statut === 'disponible') return 'home-badge home-badge-ok';
  if (statut === 'reservee') return 'home-badge home-badge-warn';
  if (statut === 'maintenance') return 'home-badge home-badge-muted';
  return 'home-badge';
}

export default function HomePage() {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Echantillon (24 voitures) : sert a la liste des marques, aux compteurs de
  // categories et aux "Offres du moment". Ce n'est pas le catalogue complet
  // (celui-ci vit sur /voitures).
  const sampleParams = useMemo(() => ({ per_page: 24 }), []);
  const { voitures } = useVoitures(sampleParams);

  // Voitures populaires : top 4 par nombre de reservations (sort=popular cote API).
  const popularParams = useMemo(() => ({ per_page: 4, sort: 'popular' }), []);
  const { voitures: popularVoitures, loading: loadingPopular } = useVoitures(popularParams);

  // Nombre de voitures par categorie (cartes "Categories populaires").
  const categoryCounts = useMemo(() => {
    const counts = {};
    voitures.forEach((voiture) => {
      if (voiture.categorie) {
        counts[voiture.categorie] = (counts[voiture.categorie] || 0) + 1;
      }
    });
    return counts;
  }, [voitures]);

  // "Offres du moment" : on met en avant quelques voitures disponibles.
  const promoVoitures = useMemo(
    () =>
      voitures
        .filter((voiture) => (voiture.effective_statut || voiture.statut) === 'disponible')
        .slice(0, 3),
    [voitures]
  );

  /* ---------- Actions / navigation ---------- */

  function handleReserve(voitureId) {
    if (isAdmin) {
      navigate(ROUTES.ADMIN_DASHBOARD);
      return;
    }
    let resaPath = toReservationNew(voitureId);
    if (dateDebut && dateFin) {
      resaPath += `?debut=${encodeURIComponent(dateDebut)}&fin=${encodeURIComponent(dateFin)}`;
    }
    if (!isAuthenticated) {
      navigate(toLoginWithNext(resaPath));
      return;
    }
    navigate(resaPath);
  }

  function handleSeeAllVoitures() {
    navigate(ROUTES.VOITURES);
  }

  function handleSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (dateDebut) params.set('debut', dateDebut);
    if (dateFin) params.set('fin', dateFin);
    const qs = params.toString();
    navigate(qs ? `${ROUTES.VOITURES}?${qs}` : ROUTES.VOITURES);
  }

  function handleCategoryClick(categorieKey) {
    navigate(`${ROUTES.VOITURES}?categorie=${encodeURIComponent(categorieKey)}`);
  }

  return (
    <Layout>
      <div className="home-page">
        {/* Calque de fond premium — fixe, subtil, ne gene pas la lecture */}
        <div className="home-bg" aria-hidden="true" />

        {/* ============ HERO ============ */}
        <section
          className="home-hero"
          style={{
            backgroundImage: `linear-gradient(120deg, rgba(6,33,33,0.78) 0%, rgba(6,78,70,0.62) 60%, rgba(15,118,110,0.45) 100%), url('${HERO_IMAGE}')`,
          }}
        >
          <div className="home-hero-content">
            <p className="home-hero-kicker">Location de voitures — SmartCarRent</p>
            <h1 className="home-hero-title">
              Conecteer la voiture <span>parfaite</span> pour chaque trajet.
            </h1>
            <p className="home-hero-sub">
              Un catalogue de vehicules verifies, des prix transparents et une reservation
              confirmee en quelques clics. Consultez librement, reservez en toute simplicite.
            </p>
            <div className="home-hero-actions">
              <button
                type="button"
                className="home-btn home-btn-primary"
                onClick={handleSeeAllVoitures}
              >
                Voir les voitures
              </button>
            </div>
          </div>
        </section>

        {/* ============ BARRE DE RECHERCHE ============ */}
        <section className="home-search-wrap">
          <form className="home-search" onSubmit={handleSearch}>
            <div className="home-search-field">
              <label>Date debut</label>
              <input
                type="date"
                value={dateDebut}
                onChange={(event) => setDateDebut(event.target.value)}
              />
            </div>
            <div className="home-search-field">
              <label>Date fin</label>
              <input
                type="date"
                value={dateFin}
                onChange={(event) => setDateFin(event.target.value)}
              />
            </div>
            <button type="submit" className="home-btn home-btn-primary home-search-btn">
              Rechercher
            </button>
          </form>
        </section>

        {/* ============ VOITURES POPULAIRES (4 cartes) ============ */}
        <section className="home-popular">
          <header className="home-section-head">
            <p className="home-section-kicker">Selection du moment</p>
            <h2>Voitures populaires</h2>
          </header>

          {loadingPopular ? (
            <div className="home-catalog-grid">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="home-car-card home-car-skeleton" aria-hidden="true">
                  <div className="home-car-img home-skeleton-block" />
                  <div className="home-car-body">
                    <div className="home-skeleton-line" style={{ width: '60%' }} />
                    <div className="home-skeleton-line" style={{ width: '40%' }} />
                    <div className="home-skeleton-line" style={{ width: '80%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : popularVoitures.length === 0 ? (
            <div className="home-empty">
              <div className="home-empty-icon" aria-hidden="true">🚗</div>
              <p>
                <strong>Aucune voiture a mettre en avant pour le moment.</strong>
              </p>
            </div>
          ) : (
            <div className="home-catalog-grid">
              {popularVoitures.slice(0, 4).map((voiture) => {
                const statut = voiture.effective_statut || voiture.statut;
                const isReservable = statut === 'disponible';
                return (
                  <article key={voiture.id} className="home-car-card">
                    <div className="home-car-img">
                      {voiture.image_url ? (
                        <img src={voiture.image_url} alt={voiture.modele} loading="lazy" />
                      ) : (
                        <div className="home-car-img-fallback">
                          <span>{voiture.marque?.nom || 'SmartCarRent'}</span>
                        </div>
                      )}
                      <span className={statutBadgeClass(statut)}>
                        {statutLabel(statut)}
                      </span>
                    </div>
                    <div className="home-car-body">
                      <div className="home-car-titles">
                        <h3>{voiture.modele}</h3>
                        <span className="home-car-marque">
                          {voiture.marque?.nom || 'Marque non precisee'}
                        </span>
                      </div>
                      <div className="home-car-price">
                        <strong>{Number(voiture.prix_par_jour || 0).toFixed(2)} DT</strong>
                        <span>/ jour</span>
                      </div>
                      <div className="home-car-actions">
                        <button
                          type="button"
                          className="home-btn home-btn-ghost-sm"
                          onClick={() => navigate(toCarDetail(voiture.id))}
                        >
                          Voir detail
                        </button>
                        <button
                          type="button"
                          className="home-btn home-btn-primary-sm"
                          onClick={() => handleReserve(voiture.id)}
                          disabled={!isReservable}
                          title={
                            isReservable
                              ? 'Reserver cette voiture'
                              : 'Voiture indisponible actuellement'
                          }
                        >
                          {isReservable ? 'Reserver' : 'Indisponible'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="home-popular-cta">
            <button
              type="button"
              className="home-btn home-btn-primary"
              onClick={handleSeeAllVoitures}
            >
              Voir toutes les voitures
            </button>
          </div>
        </section>

        {/* ============ CATEGORIES POPULAIRES ============ */}
        <section className="home-categories">
          <header className="home-section-head">
            <p className="home-section-kicker">Explorez par type</p>
            <h2>Categories populaires</h2>
          </header>
          <div className="home-cat-grid">
            {CAR_CATEGORIES.map((cat) => {
              const count = Number(categoryCounts[cat.key]) || 0;
              return (
                <article key={cat.key} className="home-cat-card">
                  <div
                    className="home-cat-img"
                    style={{ backgroundImage: `url('${cat.image}')` }}
                  />
                  <div className="home-cat-shade" />
                  <div className="home-cat-body">
                    <span className="home-cat-count">
                      {count} voiture{count > 1 ? 's' : ''}
                    </span>
                    <h3>{cat.key}</h3>
                    <p>{cat.tagline}</p>
                    <button
                      type="button"
                      className="home-cat-btn"
                      onClick={() => handleCategoryClick(cat.key)}
                    >
                      Explorer
                      <svg
                        viewBox="0 0 24 24"
                        width="15"
                        height="15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ============ POURQUOI NOUS ============ */}
        <section className="home-why">
          <header className="home-section-head">
            <p className="home-section-kicker">Pourquoi SmartCarRent</p>
            <h2>Une location pensee pour vous simplifier la vie</h2>
          </header>
          <div className="home-why-grid">
            {WHY_FEATURES.map((feature) => (
              <article
                key={feature.title}
                className={`home-feature-card tone-${feature.tone}`}
              >
                <span className="home-feature-icon">
                  <FeatureIcon name={feature.icon} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ============ COMMENT CA MARCHE ============ */}
        <section className="home-how">
          <header className="home-section-head">
            <p className="home-section-kicker">Simple et rapide</p>
            <h2>Comment ca marche ?</h2>
          </header>
          <div className="home-how-grid">
            {HOW_STEPS.map((step, index) => (
              <article key={step.title} className="home-step">
                <div className="home-step-top">
                  <span className="home-step-number">{index + 1}</span>
                  <span className="home-step-icon">
                    <FeatureIcon name={step.icon} />
                  </span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ============ OFFRES DU MOMENT ============ */}
        {promoVoitures.length > 0 && (
          <section className="home-offers">
            <header className="home-section-head">
              <p className="home-section-kicker">Bons plans</p>
              <h2>Offres du moment</h2>
            </header>
            <div className="home-offers-grid">
              {promoVoitures.map((voiture) => {
                const oldPrice = Number(voiture.prix_par_jour || 0);
                const newPrice = oldPrice * (1 - PROMO_RATE);
                return (
                  <article key={voiture.id} className="home-offer-card">
                    <div className="home-offer-img">
                      {voiture.image_url ? (
                        <img src={voiture.image_url} alt={voiture.modele} loading="lazy" />
                      ) : (
                        <div className="home-offer-img-fallback">
                          <span>{voiture.marque?.nom || 'SmartCarRent'}</span>
                        </div>
                      )}
                      <span className="home-offer-badge">-15%</span>
                    </div>
                    <div className="home-offer-body">
                      <div className="home-offer-titles">
                        <h3>{voiture.modele}</h3>
                        <span>{voiture.marque?.nom || 'Marque non precisee'}</span>
                      </div>
                      <div className="home-offer-prices">
                        <span className="home-offer-old">
                          {oldPrice.toFixed(2)} DT
                        </span>
                        <span className="home-offer-new">
                          {newPrice.toFixed(2)} DT<small>/ jour</small>
                        </span>
                      </div>
                      <button
                        type="button"
                        className="home-btn home-btn-primary-sm"
                        onClick={() => handleReserve(voiture.id)}
                      >
                        Reserver l'offre
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
