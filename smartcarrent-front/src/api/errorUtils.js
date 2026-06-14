export function getApiErrorMessage(error, fallbackMessage = 'Une erreur est survenue.') {
  // 1. Priorite haute : erreur de champ specifique (Laravel ValidationException).
  //    C'est le message le plus informatif (« Code incorrect. 4 tentatives restantes. »
  //    plutot que le generique « Erreur de validation. »).
  const fieldErrors = error?.response?.data?.errors;

  if (fieldErrors && typeof fieldErrors === 'object') {
    const firstField = Object.keys(fieldErrors)[0];
    const firstFieldError = fieldErrors[firstField]?.[0];

    if (typeof firstFieldError === 'string' && firstFieldError.trim() !== '') {
      return firstFieldError;
    }
  }

  // 2. Sinon, message generique de la reponse API.
  const responseMessage = error?.response?.data?.message;

  if (typeof responseMessage === 'string' && responseMessage.trim() !== '') {
    return responseMessage;
  }

  // 3. Sinon, message brut de l'erreur JS.
  if (typeof error?.message === 'string' && error.message.trim() !== '') {
    return error.message;
  }

  return fallbackMessage;
}
