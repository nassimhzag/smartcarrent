import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import useCarDetail, { renderCarImageFallback } from '../hooks/useCarDetail';
import Layout from '../layout/Layout';
import { ROUTES, toCarDetail, toLoginWithNext, toReservationNew } from '../routes/paths';

export default function VisitorCarDetailPage() {
  const { voitureId } = useParams();
  const { isAuthenticated, isAdmin } = useAuth();
  const {
    voiture,
    activeImageIndex,
    setActiveImageIndex,
    loading,
    similarLoading,
    error,
    galleryImages,
    similarCars,
    characteristicCards,
  } = useCarDetail(voitureId);
  const navigate = useNavigate();

  function handleReserve() {
    if (!voiture) {
      return;
    }

    if (isAdmin) {
      navigate(ROUTES.ADMIN_DASHBOARD);
      return;
    }

    if (!isAuthenticated) {
      navigate(toLoginWithNext(toReservationNew(voiture.id)));
      return;
    }

    navigate(toReservationNew(voiture.id));
  }

  function handleReserveById(targetVoitureId) {
    if (isAdmin) {
      navigate(ROUTES.ADMIN_DASHBOARD);
      return;
    }

    if (!isAuthenticated) {
      navigate(toLoginWithNext(toReservationNew(targetVoitureId)));
      return;
    }

    navigate(toReservationNew(targetVoitureId));
  }

  if (loading) {
    return (
      <Layout>
        <p>Chargement detail voiture...</p>
      </Layout>
    );
  }

  if (error || !voiture) {
    return (
      <Layout>
        <p className="error-box">{error || 'Voiture introuvable.'}</p>
        <button type="button" className="ghost-btn" onClick={() => navigate(ROUTES.HOME)}>
          Retour accueil
        </button>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="panel detail-panel">
        <div>
          <p className="kicker">Detail voiture</p>
          <h2>{voiture.modele}</h2>
          <p className="muted-row">Immatriculation: {voiture.immatriculation}</p>
        </div>

        <div className="gallery-shell">
          <div className="gallery-main">
            {galleryImages.length > 0 ? (
              <img
                src={galleryImages[activeImageIndex]}
                alt={`Vue ${activeImageIndex + 1} de ${voiture.modele}`}
              />
            ) : (
              renderCarImageFallback(voiture.modele, activeImageIndex)
            )}
          </div>

          <div className="gallery-thumbs">
            {(galleryImages.length > 0 ? galleryImages : ['fallback-1', 'fallback-2', 'fallback-3']).map(
              (image, index) => (
                <button
                  key={`${String(image)}-${index}`}
                  type="button"
                  className={`thumb-btn ${activeImageIndex === index ? 'is-active' : ''}`}
                  onClick={() => setActiveImageIndex(index)}
                >
                  {galleryImages.length > 0 ? (
                    <img src={image} alt={`Miniature ${index + 1}`} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
              )
            )}
          </div>
        </div>

        <div className="detail-grid">
          {characteristicCards.map((item) => (
            <article className="stat-card" key={item.label}>
              <p>{item.label}</p>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>

        <div className="card-actions">
          <button type="button" className="ghost-btn" onClick={() => navigate(ROUTES.HOME)}>
            Retour catalogue
          </button>
          <button type="button" className="primary-btn" onClick={handleReserve}>
            Reserver cette voiture
          </button>
        </div>
      </section>

      <section className="panel similar-panel">
        <div className="similar-head">
          <h3>Voitures similaires</h3>
          <p className="muted-row">Selection basee sur la marque et la disponibilite.</p>
        </div>

        {similarLoading ? (
          <p>Chargement des suggestions...</p>
        ) : (
          <div className="similar-grid">
            {similarCars.map((car) => (
              <article key={car.id} className="car-card compact-card">
                <h4>{car.modele}</h4>
                <p>{car.marque?.nom || 'Marque non precisee'}</p>
                <p>{Number(car.prix_par_jour || 0).toFixed(2)} MAD / jour</p>
                <p>Statut: {car.statut}</p>
                <div className="card-actions">
                  <button type="button" className="ghost-btn" onClick={() => navigate(toCarDetail(car.id))}>
                    Voir detail
                  </button>
                  <button type="button" className="primary-btn" onClick={() => handleReserveById(car.id)}>
                    Reserver
                  </button>
                </div>
              </article>
            ))}
            {!similarLoading && similarCars.length === 0 && (
              <p className="muted-row">Aucune suggestion disponible pour le moment.</p>
            )}
          </div>
        )}
      </section>
    </Layout>
  );
}
