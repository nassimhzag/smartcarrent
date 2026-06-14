// Fichier NEUTRALISE — hook orphelin apres suppression de la page
// AdminCalendriers. La gestion manuelle du calendrier n'existe plus :
// la disponibilite est calculee dynamiquement par effective_statut a partir
// du statut admin et des reservations en cours.
//
// Aucun composant ne consomme plus ce hook. Tu peux supprimer ce fichier.
export default function useAdminCalendriers() {
  return {
    entries: [],
    loading: false,
    error: '',
    reload: () => {},
  };
}
