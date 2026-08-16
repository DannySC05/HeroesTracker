import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRoutes } from './App';
import * as authApi from './auth/auth.api';
import { AuthProvider } from './auth/AuthProvider';
import { AUTH_TOKEN_KEY } from './auth/auth.storage';
import type { AuthUser } from './auth/auth.types';

vi.mock('./auth/auth.api', () => ({
  loginRequest: vi.fn(),
  getCurrentUserRequest: vi.fn(),
  logoutRequest: vi.fn(),
}));

const adminUser: AuthUser = {
  id: '1c4e018f-e338-46a8-aa33-c0ddfa95c002',
  nombre: 'Administrador General',
  email: 'admin@example.com',
  rol: 'ADMIN',
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('autenticación y navegación web', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('redirige una ruta privada al login cuando no existe sesión', async () => {
    renderAt('/app');

    expect(await screen.findByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible();
    expect(authApi.getCurrentUserRequest).not.toHaveBeenCalled();
  });

  it('muestra un error comprensible cuando el login falla', async () => {
    vi.mocked(authApi.loginRequest).mockRejectedValue(new Error('Unauthorized'));
    const user = userEvent.setup();
    renderAt('/login');

    await user.type(await screen.findByLabelText('Correo electrónico'), 'admin@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'incorrecta');
    await user.click(screen.getByRole('button', { name: 'Ingresar al sistema' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email o contraseña incorrectos.');
    expect(window.localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });

  it('inicia sesión, persiste el JWT y abre el dashboard', async () => {
    vi.mocked(authApi.loginRequest).mockResolvedValue({
      token: 'jwt-de-prueba',
      expiresIn: 7200,
      user: adminUser,
    });
    const user = userEvent.setup();
    renderAt('/login');

    await user.type(await screen.findByLabelText('Correo electrónico'), 'admin@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'AdminPassword123');
    await user.click(screen.getByRole('button', { name: 'Ingresar al sistema' }));

    expect(
      await screen.findByRole('heading', { name: 'Buen trabajo, Administrador.' }),
    ).toBeVisible();
    expect(window.localStorage.getItem(AUTH_TOKEN_KEY)).toBe('jwt-de-prueba');
    expect(authApi.loginRequest).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'AdminPassword123',
    });
  });

  it('restaura una sesión persistida consultando /auth/me', async () => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, 'jwt-persistido');
    vi.mocked(authApi.getCurrentUserRequest).mockResolvedValue(adminUser);

    renderAt('/app');

    expect(
      await screen.findByRole('heading', { name: 'Buen trabajo, Administrador.' }),
    ).toBeVisible();
    expect(authApi.getCurrentUserRequest).toHaveBeenCalledOnce();
  });

  it('elimina un token persistido cuando /auth/me lo rechaza', async () => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, 'jwt-expirado');
    vi.mocked(authApi.getCurrentUserRequest).mockRejectedValue(new Error('Unauthorized'));

    renderAt('/app');

    expect(await screen.findByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible();
    expect(window.localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });

  it('impide volver al login mientras la sesión sigue autenticada', async () => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, 'jwt-persistido');
    vi.mocked(authApi.getCurrentUserRequest).mockResolvedValue(adminUser);

    renderAt('/login');

    expect(
      await screen.findByRole('heading', { name: 'Buen trabajo, Administrador.' }),
    ).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Bienvenido de nuevo' })).not.toBeInTheDocument();
  });

  it('cierra la sesión, limpia el JWT y regresa al login', async () => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, 'jwt-persistido');
    vi.mocked(authApi.getCurrentUserRequest).mockResolvedValue(adminUser);
    vi.mocked(authApi.logoutRequest).mockResolvedValue();
    const user = userEvent.setup();
    renderAt('/app');

    await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    await waitFor(() => {
      expect(window.localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    });
    expect(await screen.findByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible();
    expect(authApi.logoutRequest).toHaveBeenCalledOnce();
  });
});
