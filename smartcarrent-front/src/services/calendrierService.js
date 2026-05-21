import { api } from '../api/client';

export async function listCalendriers(params = {}) {
  const { data } = await api.get('/calendriers', { params: { per_page: 100, ...params } });
  return data;
}

export async function createCalendrier(payload) {
  const { data } = await api.post('/calendriers', payload);
  return data;
}

export async function updateCalendrier(calendrierId, payload) {
  const { data } = await api.put(`/calendriers/${calendrierId}`, payload);
  return data;
}

export async function deleteCalendrier(calendrierId) {
  const { data } = await api.delete(`/calendriers/${calendrierId}`);
  return data;
}
