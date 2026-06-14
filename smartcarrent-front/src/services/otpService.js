import { api } from '../api/client';

/**
 * Verifie le code OTP saisi par l'utilisateur apres l'inscription.
 * Reponse (succes) : { message, user, token, redirect_to, space }
 * Reponse (echec)  : 422 ValidationException avec un message dans errors.code
 */
export async function verifyOtpRequest(payload) {
  const { data } = await api.post('/auth/verify-otp', payload);
  return data;
}

/**
 * Demande un nouveau code OTP (cooldown 60s cote backend).
 * Reponse : { message, expires_at?, expires_in_minutes }
 */
export async function resendOtpRequest(payload) {
  const { data } = await api.post('/auth/resend-otp', payload);
  return data;
}
