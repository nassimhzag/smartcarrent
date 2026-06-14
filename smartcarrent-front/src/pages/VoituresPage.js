import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import useVoitures from '../hooks/useVoitures';
import Layout from '../layout/Layout';
import {
  ROUTES,
  toCarDetail,
  toLoginWithNext,
  toReservationNew,
} from '../routes/paths';

const CATEGORIES = ['SUV', 'Berline', 'Citadine', 'Luxe', 'Utilitaire'];

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

export default function VoituresPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Etat initial lu depuis les query params de l'URL (?categorie=SUV, ?debut=, etc.)
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [categorieFilter, setCategorieFilter] = useState(searchParams.get('categorie') || 'all');
  const [marqueFilter, setMarqueFilter] = useState(searchParams.get('marque') || 'all');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [dateDebut, setDateDebut] = useState(searchParams.get('debut') || '');
  const [dateFin, setDateFin] = useState(searchParams.get('fin') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'recent');

  // On envoie les dates au backend pour qu'il filtre les voitures en chevauchement
  // de reservations / blocages calendrier. Quand les dates changent, le hook
  // recharge automatiquement (useMemo change de reference).
  const fetchParams = useMemo(() => {
    const params = { per_page: 60 };
    if (dateDebut && dateFin) {
      params.available_from = dateDebut;
      params.available_to = dateFin;
    }
    return params;
  }, [dateDebut, dateFin]);
  const { voitures, loading, error } = useVoitures(fetchParams);

  // Liste des marques deduite du catalogue (l'endpoint /marques est admin-only).
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

  function resetFilters() {
    setQuery('');
    setCategorieFilter('all');
    setMarqueFilter('all');
    setMaxPrice('');
    setDateDebut('');
    setDateFin('');
    setSortBy('recent');
    setSearchParams({}, { replace: true });
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

      const matchesCategorie =
        categorieFilter === 'all' || voiture.categorie === categorieFilter;

      return matchesQuery && matchesMarque && matchesPrice && matchesCategorie;
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
  }, [voitures, query, marqueFilter, maxPrice, sortBy, categorieFilter]);

  const hasActiveFilter =
    query.trim() !== '' ||
    categorieFilter !== 'all' ||
    marqueFilter !== 'all' ||
    maxPrice !== '' ||
    dateDebut !== '' ||
    dateFin !== '' ||
    sortBy !== 'recent';

  return (
    <Layout>
      <div className="voitures-page">
        <header className="voitures-head">
          <p className="home-section-kicker">Catalogue complet</p>
          <h1>Toutes les voitures</h1>
          <p className="muted-row">
            {loading
              ? 'Chargement du catalogue...'
              : `${filteredVoitures.length} voiture${filteredVoitures.length > 1 ? 's' : ''} disponible${filteredVoitures.length > 1 ? 's' : ''}`}
          </p>
        </header>

        <section className="voitures-filters" aria-label="Filtres du catalogue">
          <div className="voitures-filters-grid">
            <label className="voitures-filter voitures-filter-wide">
              <span>Recherche</span>
              <input
                type="search"
                placeholder="Modele, marque, immatriculation..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label className="voitures-filter">
              <span>Categorie</span>
              <select
                value={categorieFilter}
                onChange={(e) => setCategorieFilter(e.target.value)}
              >
                <option value="all">Toutes</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="voitures-filter">
              <span>Marque</span>
              <select
                value={marqueFilter}
                onChange={(e) => setMarqueFilter(e.target.value)}
              >
                <option value="all">Toutes</option>
                {marques.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className="voitures-filter">
              <span>Prix max / jour</span>
              <input
                type="number"
                min="0"
                placeholder="Sans limite"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </label>
            <label className="voitures-filter">
              <span>Date debut</span>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </label>
            <label className="voitures-filter">
              <span>Date fin</span>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </label>
            <label className="voitures-filter">
              <span>Trier par</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recent">Plus recentes</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix decroissant</option>
                <option value="model">Modele (A-Z)</option>
              </select>
            </label>
          </div>
          {hasActiveFilter && (
            <div className="voitures-filters-actions">
              <button
                type="button"
                className="voitures-filter-reset"
                onClick={resetFilters}
              >
                Reinitialiser les filtres
              </button>
            </div>
          )}
        </section>

        {error && <p className="error-box">{error}</p>}

        {loading ? (
          <div className="home-catalog-grid">
            {[0, 1, 2, 3, 4, 5].map((i) => (
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
            <p><strong>Aucune voiture ne correspond a vos criteres.</strong></p>
            <p className="muted-row">
              Essayez d'elargir votre recherche ou retirez certains filtres.
            </p>
            <button
              type="button"
              className="home-btn home-btn-ghost"
              onClick={resetFilters}
            >
              Reinitialiser les filtres
            </button>
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
      </div>
    </Layout>
  );
}
