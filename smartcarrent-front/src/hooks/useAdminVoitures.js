import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../api/errorUtils';
import {
  createVoiture,
  deleteVoiture,
  listVoitures,
  updateVoiture,
} from '../services/voitureService';

export default function useAdminVoitures(initialParams = {}) {
  const [voitures, setVoitures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadVoitures = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await listVoitures({ per_page: 100, ...initialParams });
      setVoitures(response?.data || []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Impossible de charger la liste des voitures.'));
      setVoitures([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadVoitures();
  }, [loadVoitures]);

  const addVoiture = useCallback(
    async (payload) => {
      const created = await createVoiture(payload);
      await loadVoitures();
      return created;
    },
    [loadVoitures]
  );

  const editVoiture = useCallback(
    async (voitureId, payload) => {
      const updated = await updateVoiture(voitureId, payload);
      await loadVoitures();
      return updated;
    },
    [loadVoitures]
  );

  const removeVoiture = useCallback(
    async (voitureId) => {
      await deleteVoiture(voitureId);
      await loadVoitures();
    },
    [loadVoitures]
  );

  return {
    voitures,
    loading,
    error,
    reload: loadVoitures,
    addVoiture,
    editVoiture,
    removeVoiture,
  };
}
