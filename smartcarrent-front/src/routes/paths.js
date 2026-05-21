export const ROUTES = {
  HOME: '/',
  CAR_DETAIL: '/voitures/:voitureId',
  LOGIN: '/login',
  REGISTER: '/register',
  RESERVATION_NEW: '/reservation/new/:voitureId',
  PAIEMENT_NEW: '/paiement/new/:reservationId',
  USER_DASHBOARD: '/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_VOITURES: '/admin/voitures',
  ADMIN_MARQUES: '/admin/marques',
  ADMIN_RESERVATIONS: '/admin/reservations',
  ADMIN_CLIENTS: '/admin/clients',
  ADMIN_CALENDRIERS: '/admin/calendrier',
  ADMIN_PAIEMENTS: '/admin/paiements',
};

export function toCarDetail(voitureId) {
  return ROUTES.CAR_DETAIL.replace(':voitureId', String(voitureId));
}

export function toReservationNew(voitureId) {
  return ROUTES.RESERVATION_NEW.replace(':voitureId', String(voitureId));
}

export function toPaiementNew(reservationId) {
  return ROUTES.PAIEMENT_NEW.replace(':reservationId', String(reservationId));
}

export function toLoginWithNext(nextPath) {
  return `${ROUTES.LOGIN}?next=${encodeURIComponent(nextPath)}`;
}
