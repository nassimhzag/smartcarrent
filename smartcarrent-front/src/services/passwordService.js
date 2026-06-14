import { api } from '../api/client';

/**
 * POST /api/auth/forgot-password
 * Demande l'envoi d'un code OTP a l'email saisi.
 * Reponse generique (cote backend) pour eviter la divulgation d'existence de compte.
 */
export async function forgotPasswordRequest(email) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

/**
 * POST /api/auth/reset-password
 * Verifie le code OTP et met a jour le mot de passe.
 * Payload : { email, code, password, password_confirmation }
 */
export async function resetPasswordRequest(payload) {
  const { data } = await api.post('/auth/reset-password', payload);
  return data;
}
