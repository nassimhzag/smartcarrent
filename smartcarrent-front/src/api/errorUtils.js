export function getApiErrorMessage(error, fallbackMessage = 'Une erreur est survenue.') {
  const responseMessage = error?.response?.data?.message;

  if (typeof responseMessage === 'string' && responseMessage.trim() !== '') {
    return responseMessage;
  }

  const fieldErrors = error?.response?.data?.errors;

  if (fieldErrors && typeof fieldErrors === 'object') {
    const firstField = Object.keys(fieldErrors)[0];
    const firstFieldError = fieldErrors[firstField]?.[0];

    if (typeof firstFieldError === 'string' && firstFieldError.trim() !== '') {
      return firstFieldError;
    }
  }

  if (typeof error?.message === 'string' && error.message.trim() !== '') {
    return error.message;
  }

  return fallbackMessage;
}
