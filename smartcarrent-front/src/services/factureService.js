import { api } from '../api/client';

/**
 * Une facture est disponible des qu'un paiement lie a la reservation a ete
 * encaisse (paiement.statut = 'paye'). Sinon le bouton est desactive.
 * Une reservation terminee a forcement ete payee (invariant metier), donc
 * sa facture reste accessible.
 */
export function canDownloadFacture(reservation) {
  if (!reservation) return false;
  if (reservation.paiement?.statut === 'paye') return true;
  if (reservation.statut === 'terminee') return true;
  // Compat libelle historique (avant migration).
  if (reservation.statut === 'confirmee') return true;
  return false;
}

/**
 * Lit le nom de fichier suggere par le header Content-Disposition de l'API.
 * Tolerant : si rien n'est trouve, on retombe sur un nom client.
 */
function extractFilename(contentDisposition, fallback) {
  if (!contentDisposition) return fallback;
  // Cas RFC5987 : filename*=UTF-8''...
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch (e) {
      // ignore
    }
  }
  const match = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (match && match[1]) return match[1];
  return fallback;
}

/**
 * Si l'API renvoie une erreur JSON dans un blob, on tente d'en extraire un message lisible.
 */
async function readBlobError(blob, fallback) {
  try {
    const text = await blob.text();
    const json = JSON.parse(text);
    return json?.message || json?.error || fallback;
  } catch (e) {
    return fallback;
  }
}

/**
 * Telecharge la facture PDF d'une reservation donnee et declenche le download
 * navigateur via un blob URL (anchor click + cleanup).
 *
 * Levee d'erreur :
 *  - statut 403  -> "Vous n'etes pas autorise a telecharger cette facture."
 *  - statut 409  -> "Aucune facture disponible pour cette reservation."
 *  - autres      -> "Impossible de telecharger la facture."
 */
export async function downloadFactureForReservation(reservationId) {
  let response;
  try {
    response = await api.get(`/reservations/${reservationId}/facture`, {
      responseType: 'blob',
    });
  } catch (error) {
    const status = error?.response?.status;
    const blob = error?.response?.data;
    let message = 'Impossible de telecharger la facture.';
    if (status === 403) message = "Vous n'etes pas autorise a telecharger cette facture.";
    if (status === 409) message = 'Aucune facture disponible pour cette reservation.';
    if (blob && typeof blob.text === 'function') {
      message = await readBlobError(blob, message);
    }
    const wrapped = new Error(message);
    wrapped.status = status;
    throw wrapped;
  }

  const fallbackName = `facture-RES-${String(reservationId).padStart(6, '0')}.pdf`;
  const filename = extractFilename(
    response.headers?.['content-disposition'] || response.headers?.['Content-Disposition'],
    fallbackName
  );

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Liberation du Blob URL apres un tick (Chrome a besoin du temps pour declencher le download).
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);

  return filename;
}
