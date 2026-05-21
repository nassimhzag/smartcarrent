import { api } from '../api/client';

export async function listPaiements(params = {}) {
  const { data } = await api.get('/paiements', { params });
  return data;
}

export async function getPaiementById(paiementId) {
  const { data } = await api.get(`/paiements/${paiementId}`);
  return data;
}

/**
 * Cree un paiement reussi pour une reservation 'en_attente_paiement'.
 * Le backend confirme automatiquement la reservation associee.
 */
export async function payReservation(payload) {
  const { data } = await api.post('/paiements', payload);
  return data;
}

/**
 * Action admin : refuser un paiement (paiement -> echoue, reservation -> annulee).
 */
export async function rejectPaiement(paiementId) {
  const { data } = await api.patch(`/paiements/${paiementId}/reject`);
  return data;
}

/**
 * Action admin : confirmer un paiement sur place (especes -> paye, reservation -> confirmee).
 */
export async function confirmPaiement(paiementId) {
  const { data } = await api.patch(`/paiements/${paiementId}/confirm`);
  return data;
}

/**
 * Action admin : rembourser un paiement (paiement -> rembourse, reservation -> annulee).
 */
export async function refundPaiement(paiementId) {
  const { data } = await api.patch(`/paiements/${paiementId}/refund`);
  return data;
}
