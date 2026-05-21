import { useCallback, useEffect, useState } from 'react';
import { createReservation, listReservationHistory } from '../services/reservationService';

export default function useReservations(initialHistoryParams = null) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(Boolean(initialHistoryParams));
  const [error, setError] = useState('');

  const loadHistory = useCallback(async (params = initialHistoryParams || {}) => {
    setError('');

    try {
      setLoading(true);
      const data = await listReservationHistory(params);
      setReservations(Array.isArray(data?.data) ? data.data : []);
      return data;
    } catch (requestError) {
      setError('Impossible de charger les reservations.');
      setReservations([]);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [initialHistoryParams]);

  const submitReservation = useCallback(async (payload) => {
    setError('');
    return createReservation(payload);
  }, []);

  useEffect(() => {
    if (!initialHistoryParams) {
      return;
    }

    loadHistory(initialHistoryParams).catch(() => {
      // Error state is handled in loadHistory.
    });
  }, [initialHistoryParams, loadHistory]);

  return {
    reservations,
    loading,
    error,
    loadHistory,
    submitReservation,
  };
}
