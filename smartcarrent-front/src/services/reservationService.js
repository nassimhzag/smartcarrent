import { api } from '../api/client';

export async function createReservation(payload) {
  const { data } = await api.post('/reservations', payload);
  return data;
}

export async function listReservationHistory(params = {}) {
  const { data } = await api.get('/reservations/history', { params });
  return data;
}

export async function listReservations(params = {}) {
  const { data } = await api.get('/reservations', { params });
  return data;
}

export async function getReservationById(reservationId) {
  const { data } = await api.get(`/reservations/${reservationId}`);
  return data;
}

export async function updateReservation(reservationId, payload) {
  const { data } = await api.put(`/reservations/${reservationId}`, payload);
  return data;
}

/**
 * Action admin : cloturer une location (le client a rendu le vehicule).
 *
 * INVARIANT METIER cote backend : le paiement doit etre 'paye' pour pouvoir
 * cloturer. Si ce n'est pas le cas, l'API repond 422 avec un message clair.
 *
 * Apres cloture : reservation.statut = 'terminee' et le vehicule redevient
 * automatiquement disponible (effective_statut).
 */
export async function terminerReservation(reservationId) {
  const { data } = await api.patch(`/reservations/${reservationId}/terminer`);
  return data;
}

/**
 * Action client : annuler sa propre reservation.
 * Le backend refuse si un paiement a deja ete encaisse (paiement.statut === 'paye').
 */
export async function cancelReservation(reservationId) {
  const { data } = await api.patch(`/reservations/${reservationId}/cancel`);
  return data;
}

/**
 * Action admin : supprimer definitivement une reservation.
 */
export async function deleteReservation(reservationId) {
  await api.delete(`/reservations/${reservationId}`);
  return null;
}
