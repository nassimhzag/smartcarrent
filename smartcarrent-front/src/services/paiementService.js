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
 * Cree un paiement pour une reservation 'en_cours' sans paiement actuel.
 *
 * Logique unifiee : quel que soit le mode (carte, virement, mobile_money,
 * especes), le backend marque immediatement le paiement comme 'paye'. La
 * reservation reste 'en_cours' jusqu'a sa cloture par l'admin.
 */
export async function payReservation(payload) {
  const { data } = await api.post('/paiements', payload);
  return data;
}

/**
 * Action admin : rembourser un paiement (paiement -> rembourse, reservation -> annulee).
 */
export async function refundPaiement(paiementId) {
  const { data } = await api.patch(`/paiements/${paiementId}/refund`);
  return data;
}
