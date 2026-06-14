import { api } from '../api/client';

/**
 * GET /api/admin/dashboard/stats
 * Renvoie summary + 4 datasets agrégés (revenu mensuel, top voitures,
 * répartition statuts, réservations quotidiennes).
 */
export async function fetchAdminDashboardStats() {
  const { data } = await api.get('/admin/dashboard/stats');
  return data;
}
