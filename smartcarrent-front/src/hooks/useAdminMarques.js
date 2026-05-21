import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../api/errorUtils';
import {
  createMarque,
  deleteMarque,
  listMarques,
  updateMarque,
} from '../services/marqueService';

export default function useAdminMarques() {
  const [marques, setMarques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMarques = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await listMarques();
      setMarques(response?.data || []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Impossible de charger les marques.'));
      setMarques([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMarques();
  }, [loadMarques]);

  const addMarque = useCallback(
    async (payload) => {
      const created = await createMarque(payload);
      await loadMarques();
      return created;
    },
    [loadMarques]
  );

  const editMarque = useCallback(
    async (marqueId, payload) => {
      const updated = await updateMarque(marqueId, payload);
      await loadMarques();
      return updated;
    },
    [loadMarques]
  );

  const removeMarque = useCallback(
    async (marqueId) => {
      await deleteMarque(marqueId);
      await loadMarques();
    },
    [loadMarques]
  );

  return {
    marques,
    loading,
    error,
    reload: loadMarques,
    addMarque,
    editMarque,
    removeMarque,
  };
}
