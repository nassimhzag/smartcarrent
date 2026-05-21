import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { appRoutes } from './routeConfig';
import { ROUTES } from './paths';

export default function AppRoutes() {
  return (
    <Routes>
      {appRoutes.map((route) => {
        const Element = route.element;

        if (route.role) {
          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                <ProtectedRoute role={route.role}>
                  <Element />
                </ProtectedRoute>
              }
            />
          );
        }

        return <Route key={route.path} path={route.path} element={<Element />} />;
      })}

      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}
