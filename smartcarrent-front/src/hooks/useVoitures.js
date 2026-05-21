import { useCallback, useEffect, useState } from 'react';
import { listVoitures } from '../services/voitureService';

export default function useVoitures(initialParams = {}) {
  const [voitures, setVoitures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadVoitures = useCallback(async (params = initialParams) => {
    try {
      setLoading(true);
      setError('');
      const data = await listVoitures(params);
      setVoitures(Array.isArray(data?.data) ? data.data : []);
    } catch (requestError) {
      setError('Impossible de charger les voitures. Verifiez que le backend est demarre.');
      setVoitures([]);
    } finally {
      setLoading(false);
    }
  }, [initialParams]);

  useEffect(() => {
    loadVoitures(initialParams);
  }, [initialParams, loadVoitures]);

  return {
    voitures,
    loading,
    error,
    loadVoitures,
  };
}
