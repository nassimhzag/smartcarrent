import { api } from '../api/client';

export async function listClients(params = {}) {
  const { data } = await api.get('/clients', { params: { per_page: 100, ...params } });
  return data;
}

export async function getClientById(clientId) {
  const { data } = await api.get(`/clients/${clientId}`);
  return data;
}

export async function updateClient(clientId, payload) {
  const { data } = await api.put(`/clients/${clientId}`, payload);
  return data;
}

export async function deleteClient(clientId) {
  const { data } = await api.delete(`/clients/${clientId}`);
  return data;
}
