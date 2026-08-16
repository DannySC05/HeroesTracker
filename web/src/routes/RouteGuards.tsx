import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from '../auth/auth-context';
import { LoadingScreen } from '../components/LoadingScreen';

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (status === 'authenticated') {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}

export function RootRedirect() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  return <Navigate to={status === 'authenticated' ? '/app' : '/login'} replace />;
}
