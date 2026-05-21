import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROUTES } from '../routes/paths';

export default function ProtectedRoute({ children, role }) {
  const { booting, isAuthenticated, isAdmin, isUtilisateur } = useAuth();
  const location = useLocation();

  if (booting) {
    return <div className="center-screen">Verification de session...</div>;
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`${ROUTES.LOGIN}?next=${next}`} replace />;
  }

  if (role === 'admin' && !isAdmin) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (role === 'utilisateur' && !isUtilisateur) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return children;
}
