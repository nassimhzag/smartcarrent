import AdminCalendriers from '../pages/AdminCalendriers';
import AdminClients from '../pages/AdminClients';
import AdminDashboard from '../pages/AdminDashboard';
import AdminMarques from '../pages/AdminMarques';
import AdminPaiements from '../pages/AdminPaiements';
import AdminReservations from '../pages/AdminReservations';
import AdminVoitures from '../pages/AdminVoitures';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import PaiementPage from '../pages/PaiementPage';
import RegisterPage from '../pages/RegisterPage';
import ReservationPage from '../pages/ReservationPage';
import UserDashboard from '../pages/UserDashboard';
import VisitorCarDetailPage from '../pages/VisitorCarDetailPage';
import { ROUTES } from './paths';

export const appRoutes = [
  { path: ROUTES.HOME, element: HomePage },
  { path: ROUTES.CAR_DETAIL, element: VisitorCarDetailPage },
  { path: ROUTES.LOGIN, element: LoginPage },
  { path: ROUTES.REGISTER, element: RegisterPage },
  { path: ROUTES.RESERVATION_NEW, element: ReservationPage, role: 'utilisateur' },
  { path: ROUTES.PAIEMENT_NEW, element: PaiementPage, role: 'utilisateur' },
  { path: ROUTES.USER_DASHBOARD, element: UserDashboard, role: 'utilisateur' },
  { path: ROUTES.ADMIN_DASHBOARD, element: AdminDashboard, role: 'admin' },
  { path: ROUTES.ADMIN_VOITURES, element: AdminVoitures, role: 'admin' },
  { path: ROUTES.ADMIN_MARQUES, element: AdminMarques, role: 'admin' },
  { path: ROUTES.ADMIN_RESERVATIONS, element: AdminReservations, role: 'admin' },
  { path: ROUTES.ADMIN_CLIENTS, element: AdminClients, role: 'admin' },
  { path: ROUTES.ADMIN_CALENDRIERS, element: AdminCalendriers, role: 'admin' },
  { path: ROUTES.ADMIN_PAIEMENTS, element: AdminPaiements, role: 'admin' },
];
