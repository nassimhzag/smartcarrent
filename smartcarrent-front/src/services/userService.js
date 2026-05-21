import { api } from '../api/client';

export async function listUsers(params = {}) {
  const { data } = await api.get('/users', { params });
  return data;
}
