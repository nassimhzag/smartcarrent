import { useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage } from '../api/errorUtils';
import { getVoitureById, listVoitures } from '../services/voitureService';

function buildCarImageGallery(voiture) {
  if (!voiture) {
    return [];
  }

  const directCandidates = [
    voiture.image_url,
    voiture.image,
    voiture.photo,
    voiture.cover,
    voiture.thumbnail,
  ];

  const listCandidates = [
    ...(Array.isArray(voiture.images) ? voiture.images : []),
    ...(Array.isArray(voiture.gallery) ? voiture.gallery : []),
    ...(Array.isArray(voiture.photos) ? voiture.photos : []),
  ];

  return [...directCandidates, ...listCandidates]
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if (item && typeof item === 'object') {
        return item.url || item.image_url || item.path || '';
      }

      return '';
    })
    .map((item) => item.trim())
    .filter((item) => item !== '')
    .filter((item, index, array) => array.indexOf(item) === index);
}

export function renderCarImageFallback(modele, index) {
  const variants = ['Face avant', 'Profil', 'Interieur'];
  const label = variants[index] || `Vue ${index + 1}`;

  return (
    <div className="gallery-fallback" aria-label={`Image indisponible ${label}`}>
      <p>{label}</p>
      <strong>{modele || 'Voiture'}</strong>
      <span>Visuel a venir</span>
    </div>
  );
}

export default function useCarDetail(voitureId) {
  const [voiture, setVoiture] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadVoiture() {
      try {
        setLoading(true);
        setError('');
        const data = await getVoitureById(voitureId);
        setVoiture(data);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Voiture introuvable ou indisponible pour le moment.'));
      } finally {
        setLoading(false);
      }
    }

    loadVoiture();
  }, [voitureId]);

  useEffect(() => {
    async function loadSimilarCatalog() {
      if (!voiture) {
        return;
      }

      try {
        setSimilarLoading(true);
        const data = await listVoitures({ per_page: 18 });
        setCatalog(Array.isArray(data?.data) ? data.data : []);
      } catch (requestError) {
        setCatalog([]);
      } finally {
        setSimilarLoading(false);
      }
    }

    loadSimilarCatalog();
  }, [voiture]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [voiture]);

  const galleryImages = useMemo(() => buildCarImageGallery(voiture), [voiture]);

  const similarCars = useMemo(() => {
    if (!voiture || catalog.length === 0) {
      return [];
    }

    const currentId = Number(voiture.id);
    const brandId = voiture.marque?.id;
    const brandName = String(voiture.marque?.nom || '').toLowerCase();

    const candidates = catalog.filter((item) => Number(item.id) !== currentId);

    const sameBrand = candidates.filter((item) => {
      if (brandId && item.marque?.id) {
        return Number(item.marque.id) === Number(brandId);
      }

      if (brandName !== '') {
        return String(item.marque?.nom || '').toLowerCase() === brandName;
      }

      return false;
    });

    const others = candidates.filter((item) => {
      if (sameBrand.some((sameItem) => Number(sameItem.id) === Number(item.id))) {
        return false;
      }

      return item.statut === 'disponible' || voiture.statut !== 'disponible';
    });

    return [...sameBrand, ...others].slice(0, 3);
  }, [catalog, voiture]);

  const characteristicCards = useMemo(() => {
    if (!voiture) {
      return [];
    }

    return [
      { label: 'Marque', value: voiture.marque?.nom || 'Non precisee' },
      { label: 'Modele', value: voiture.modele || '-' },
      { label: 'Annee', value: voiture.annee || '-' },
      { label: 'Immatriculation', value: voiture.immatriculation || '-' },
      { label: 'Statut', value: voiture.statut || '-' },
      { label: 'Prix par jour', value: `${Number(voiture.prix_par_jour || 0).toFixed(2)} MAD` },
      {
        label: 'Reservations',
        value: Array.isArray(voiture.reservations) ? String(voiture.reservations.length) : '-',
      },
      {
        label: 'Recommandations',
        value: Array.isArray(voiture.recommendations) ? String(voiture.recommendations.length) : '-',
      },
    ];
  }, [voiture]);

  return {
    voiture,
    activeImageIndex,
    setActiveImageIndex,
    loading,
    similarLoading,
    error,
    galleryImages,
    similarCars,
    characteristicCards,
  };
}
