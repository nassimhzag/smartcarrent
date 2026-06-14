// Fichier NEUTRALISE — service orphelin apres retrait des routes API
// calendriers cote backend. Les fonctions exportees ci-dessous ne sont
// plus appelees nulle part. Tu peux supprimer ce fichier.

export async function listCalendriers() {
  return { data: [], meta: { total: 0 } };
}

export async function createCalendrier() {
  throw new Error('Calendrier API removed.');
}

export async function updateCalendrier() {
  throw new Error('Calendrier API removed.');
}

export async function deleteCalendrier() {
  throw new Error('Calendrier API removed.');
}
