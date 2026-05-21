import { api } from '../api/client';

export async function listMarques(params = {}) {
  const { data } = await api.get('/marques', { params: { per_page: 100, ...params } });
  return data;
}

export async function createMarque(payload) {
  const { data } = await api.post('/marques', payload);
  return data;
}

export async function updateMarque(marqueId, payload) {
  const { data } = await api.put(`/marques/${marqueId}`, payload);
  return data;
}

export async function deleteMarque(marqueId) {
  const { data } = await api.delete(`/marques/${marqueId}`);
  return data;
}
