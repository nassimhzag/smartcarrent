import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import useVoitures from '../hooks/useVoitures';
import Layout from '../layout/Layout';
import { ROUTES, toCarDetail, toLoginWithNext, toReservationNew } from '../routes/paths';

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
    text: "Reservez votre voiture en quelques clics, sans paperasse inutile.",
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
  const [query, setQuery] = useState('');
  const [marqueFilter, setMarqueFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const catalogRef = useRef(null);

  const initialVoitureParams = useMemo(() => ({ per_page: 24 }), []);
  const { voitures, loading, error } = useVoitures(initialVoitureParams);

  // Liste des marques derivee du catalogue (l'endpoint /marques est admin-only).
  const marques = useMemo(() => {
    const set = new Set();
    voitures.forEach((v) => {
      if (v.marque?.nom) set.add(v.marque.nom);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [voitures]);

  function handleReserve(voitureId) {
    if (isAdmin) {
      navigate(ROUTES.ADMIN_DASHBOARD);
      return;
    }

    // Si l'utilisateur a deja saisi les dates dans la barre de recherche,
    // on les transmet a la page reservation via query params (?debut=&fin=).
    // Ces query params survivent meme au detour par la page de login.
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

  function scrollToCatalog() {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleHeroReserve() {
    // Visiteur : on l'invite a se connecter. Connecte : on l'amene au catalogue.
    if (!isAuthenticated && !isAdmin) {
      navigate(ROUTES.LOGIN);
      return;
    }
    scrollToCatalog();
  }

  const filteredVoitures = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const maxPriceNumber = maxPrice === '' ? null : Number(maxPrice);

    const result = voitures.filter((voiture) => {
      const matchesQuery =
        normalizedQuery === '' ||
        String(voiture.modele || '').toLowerCase().includes(normalizedQuery) ||
        String(voiture.immatriculation || '').toLowerCase().includes(normalizedQuery) ||
        String(voiture.marque?.nom || '').toLowerCase().includes(normalizedQuery);

      const matchesMarque =
        marqueFilter === 'all' || voiture.marque?.nom === marqueFilter;

      const matchesPrice =
        maxPriceNumber === null || Number(voiture.prix_par_jour || 0) <= maxPriceNumber;

      return matchesQuery && matchesMarque && matchesPrice;
    });

    if (sortBy === 'price_asc') {
      return [...result].sort((a, b) => Number(a.prix_par_jour) - Number(b.prix_par_jour));
    }
    if (sortBy === 'price_desc') {
      return [...result].sort((a, b) => Number(b.prix_par_jour) - Number(a.prix_par_jour));
    }
    if (sortBy === 'model') {
      return [...result].sort((a, b) => String(a.modele).localeCompare(String(b.modele)));
    }
    return result;
  }, [voitures, query, marqueFilter, maxPrice, sortBy]);

  function handleSearch(event) {
    event.preventDefault();
    scrollToCatalog();
  }

  return (
    <Layout>
      <div className="home-page">
        {/* ============ HERO ============ */}
        <section
          className="home-hero"
          style={{
            backgroundImage:
              `linear-gradient(120deg, rgba(6,33,33,0.78) 0%, rgba(6,78,70,0.62) 60%, rgba(15,118,110,0.45) 100%), url('${HERO_IMAGE}')`,
          }}
        >
          <div className="home-hero-content">
            <p className="home-hero-kicker">Location de voitures — SmartCarRent</p>
            <h1 className="home-hero-title">
              Louez la voiture <span>parfaite</span> pour chaque trajet.
            </h1>
            <p className="home-hero-sub">
              Un catalogue de vehicules verifies, des prix transparents et une reservation
              confirmee en quelques clics. Consultez librement, reservez en toute simplicite.
            </p>
            <div className="home-hero-actions">
              <button type="button" className="home-btn home-btn-primary" onClick={scrollToCatalog}>
                Voir les voitures
              </button>
              <button type="button" className="home-btn home-btn-ghost" onClick={handleHeroReserve}>
                Reserver maintenant
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
            <div className="home-search-field">
              <label>Marque</label>
              <select value={marqueFilter} onChange={(event) => setMarqueFilter(event.target.value)}>
                <option value="all">Toutes les marques</option>
                {marques.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="home-search-field">
              <label>Prix max / jour</label>
              <input
                type="number"
                min="0"
                placeholder="Sans limite"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
              />
            </div>
            <button type="submit" className="home-btn home-btn-primary home-search-btn">
              Rechercher
            </button>
          </form>
        </section>

        {/* ============ CATALOGUE ============ */}
        <section className="home-catalog-section" ref={catalogRef}>
          <header className="home-catalog-head">
            <div>
              <h2>Notre catalogue</h2>
              <p className="muted-row">
                {loading
                  ? 'Chargement du catalogue...'
                  : `${filteredVoitures.length} voiture(s) disponible(s)`}
              </p>
            </div>
            <div className="home-catalog-controls">
              <input
                className="home-inline-input"
                type="search"
                placeholder="Rechercher un modele..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <select
                className="home-inline-input"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="recent">Plus recentes</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix decroissant</option>
                <option value="model">Modele (A-Z)</option>
              </select>
            </div>
          </header>

          {error && <p className="error-box">{error}</p>}

          {loading ? (
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
          ) : filteredVoitures.length === 0 ? (
            <div className="home-empty">
              <div className="home-empty-icon" aria-hidden="true">🚗</div>
              <p>
                <strong>Aucune voiture ne correspond a votre recherche.</strong>
              </p>
              <p className="muted-row">Essayez d'elargir vos criteres de recherche.</p>
            </div>
          ) : (
            <div className="home-catalog-grid">
              {filteredVoitures.map((voiture) => {
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
                      <span className={statutBadgeClass(statut)}>{statutLabel(statut)}</span>
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
        </section>

        {/* ============ POURQUOI NOUS ============ */}
        <section className="home-why">
          <header className="home-section-head">
            <p className="home-section-kicker">Pourquoi SmartCarRent</p>
            <h2>Une location pensee pour vous simplifier la vie</h2>
          </header>
          <div className="home-why-grid">
            {WHY_FEATURES.map((feature) => (
              <article key={feature.title} className={`home-feature-card tone-${feature.tone}`}>
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

        {/* ============ FOOTER ============ */}
        <footer className="home-footer">
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
              <ul>
                <li>Avenue Habib Bourguiba, Tunis</li>
                <li>+216 71 000 000</li>
                <li>Lun — Sam : 8h - 19h</li>
              </ul>
            </div>

            <div className="home-footer-col">
              <h4>Email</h4>
              <ul>
                <li>contact@smartcarrent.tn</li>
                <li>support@smartcarrent.tn</li>
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
        </footer>
      </div>
    </Layout>
  );
}
