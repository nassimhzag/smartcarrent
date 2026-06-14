import { useCallback, useEffect, useState } from 'react';
import { fetchAdminDashboardStats } from '../services/adminDashboardService';
import { getApiErrorMessage } from '../api/errorUtils';

const EMPTY_STATS = {
  summary: {
    total_revenue: 0,
    total_reservations: 0,
    total_voitures: 0,
    total_clients: 0,
    paid_paiements: 0,
    pending_reservations: 0,
    confirmed_reservations: 0,
    refunded_amount: 0,
  },
  revenue_monthly: [],
  top_voitures: [],
  status_breakdown: [],
  reservations_daily: [],
};

/**
 * Hook pour le tableau de bord administrateur.
 * Charge l'ensemble des donnees aggregees en un seul appel API.
 */
export default function useAdminDashboard() {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchAdminDashboardStats();
      setStats({ ...EMPTY_STATS, ...(data || {}) });
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'Impossible de charger les statistiques du tableau de bord.'
        )
      );
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, loading, error, reload: load };
}
