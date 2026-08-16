import { useState } from 'react';
import { NavLink, Outlet } from 'react-router';

import { useAuth } from '../auth/auth-context';
import { Brand } from '../components/Brand';
import { Icon } from '../components/Icon';

export function AppLayout() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  const initials = user?.nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className={`private-shell${navigationOpen ? ' private-shell--nav-open' : ''}`}>
      <button
        className="private-shell__backdrop"
        type="button"
        aria-label="Cerrar navegación"
        onClick={() => setNavigationOpen(false)}
      />

      <aside className="sidebar">
        <div className="sidebar__brand">
          <Brand compact />
          <button
            className="icon-button sidebar__close"
            type="button"
            aria-label="Cerrar navegación"
            onClick={() => setNavigationOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Navegación principal">
          <p className="sidebar__label">Centro de control</p>
          <NavLink
            className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
            to="/app"
            end
            onClick={() => setNavigationOpen(false)}
          >
            <Icon name="grid" />
            <span>Resumen</span>
          </NavLink>
          <NavLink
            className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
            to="/app/heroes"
            onClick={() => setNavigationOpen(false)}
          >
            <Icon name="users" />
            <span>Héroes</span>
          </NavLink>
          <NavLink
            className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
            to="/app/misiones"
            onClick={() => setNavigationOpen(false)}
          >
            <Icon name="target" />
            <span>Misiones</span>
          </NavLink>
          {user?.rol === 'ADMIN' ? (
            <NavLink
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
              to="/app/usuarios"
              onClick={() => setNavigationOpen(false)}
            >
              <Icon name="users" />
              <span>Usuarios</span>
            </NavLink>
          ) : null}
        </nav>

        <div className="sidebar__security">
          <span className="sidebar__security-icon">
            <Icon name="shield" />
          </span>
          <div>
            <strong>Canal seguro</strong>
            <span>Sesión JWT activa</span>
          </div>
          <i />
        </div>
      </aside>

      <div className="private-shell__main">
        <header className="topbar">
          <button
            className="icon-button topbar__menu"
            type="button"
            aria-label="Abrir navegación"
            onClick={() => setNavigationOpen(true)}
          >
            <Icon name="menu" />
          </button>

          <div className="topbar__status">
            <span /> Sistema operativo
          </div>

          <div className="topbar__user">
            <span className="topbar__avatar">{initials}</span>
            <span className="topbar__identity">
              <strong>{user?.nombre}</strong>
              <small>{user?.rol}</small>
            </span>
            <button
              className="icon-button"
              type="button"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              disabled={loggingOut}
              onClick={() => void handleLogout()}
            >
              <Icon name="logout" />
            </button>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
