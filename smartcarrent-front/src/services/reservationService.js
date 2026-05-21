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
 * Action admin : marquer une reservation comme terminee.
 * La confirmation est desormais automatique apres paiement reussi.
 */
export async function completeReservation(reservationId) {
  return updateReservation(reservationId, { statut: 'terminee' });
}

/**
 * Action admin : supprimer definitivement une reservation.
 */
export async function deleteReservation(reservationId) {
  await api.delete(`/reservations/${reservationId}`);
  return null;
}
