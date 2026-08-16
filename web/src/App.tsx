import { BrowserRouter, Route, Routes } from 'react-router';

import { AuthProvider } from './auth/AuthProvider';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { HeroesPage } from './pages/HeroesPage';
import { LoginPage } from './pages/LoginPage';
import { MissionsPage } from './pages/MissionsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute, PublicOnlyRoute, RootRedirect } from './routes/RouteGuards';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="heroes" element={<HeroesPage />} />
          <Route path="misiones" element={<MissionsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
