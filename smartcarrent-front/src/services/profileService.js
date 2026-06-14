import { api } from '../api/client';

/**
 * PUT /api/me/profile
 * Met a jour les informations du profil utilisateur (nom, telephone, adresse).
 */
export async function updateProfileRequest(payload) {
  const { data } = await api.put('/me/profile', payload);
  return data;
}

/**
 * PUT /api/me/password
 * Change le mot de passe avec verification du mot de passe actuel.
 * Payload : { current_password, password, password_confirmation }
 */
export async function changePasswordRequest(payload) {
  const { data } = await api.put('/me/password', payload);
  return data;
}
