import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../api/errorUtils';
import {
  completeReservation,
  deleteReservation,
  listReservations,
} from '../services/reservationService';

export default function useAdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await listReservations({ per_page: 100 });
      setReservations(response?.data || []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Impossible de charger les reservations.'));
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const complete = useCallback(
    async (reservationId) => {
      const updated = await completeReservation(reservationId);
      await loadReservations();
      return updated;
    },
    [loadReservations]
  );

  const remove = useCallback(
    async (reservationId) => {
      await deleteReservation(reservationId);
      await loadReservations();
    },
    [loadReservations]
  );

  return {
    reservations,
    loading,
    error,
    reload: loadReservations,
    complete,
    remove,
  };
}
