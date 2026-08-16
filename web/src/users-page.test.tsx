import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRoutes } from './App';
import * as authApi from './auth/auth.api';
import { AuthProvider } from './auth/AuthProvider';
import { AUTH_TOKEN_KEY } from './auth/auth.storage';
import type { AuthUser } from './auth/auth.types';
import * as userApi from './users/user.api';

vi.mock('./auth/auth.api', () => ({
  loginRequest: vi.fn(),
  getCurrentUserRequest: vi.fn(),
  logoutRequest: vi.fn(),
}));

vi.mock('./users/user.api', () => ({
  listConsultationUsers: vi.fn(),
  createConsultationUser: vi.fn(),
  updateConsultationUser: vi.fn(),
}));

const admin: AuthUser = {
  id: '1c4e018f-e338-46a8-aa33-c0ddfa95c002',
  nombre: 'Administrador',
  email: 'admin@example.com',
  rol: 'ADMIN',
  activo: true,
};

function renderUsers() {
  localStorage.setItem(AUTH_TOKEN_KEY, 'admin-token');
  return render(
    <MemoryRouter initialEntries={['/app/usuarios']}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('módulo web de usuarios', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.mocked(authApi.getCurrentUserRequest).mockResolvedValue(admin);
    vi.mocked(userApi.listConsultationUsers).mockResolvedValue([
      {
        id: '2c4e018f-e338-46a8-aa33-c0ddfa95c003',
        nombre: 'Agente Consulta',
        email: 'agente@example.com',
        rol: 'CONSULTA',
        activo: true,
      },
    ]);
  });

  it('lista usuarios y permite crear una cuenta CONSULTA', async () => {
    vi.mocked(userApi.createConsultationUser).mockResolvedValue({
      id: '3c4e018f-e338-46a8-aa33-c0ddfa95c004',
      nombre: 'Nuevo Agente',
      email: 'nuevo@example.com',
      rol: 'CONSULTA',
      activo: true,
    });
    renderUsers();

    expect(await screen.findByRole('heading', { name: 'Usuarios' })).toBeVisible();
    expect(await screen.findByText('Agente Consulta')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: /nuevo usuario/i }));
    await userEvent.type(screen.getByLabelText('Nombre'), 'Nuevo Agente');
    await userEvent.type(screen.getByLabelText('Email'), 'NUEVO@example.com');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar usuario' }));

    await waitFor(() =>
      expect(userApi.createConsultationUser).toHaveBeenCalledWith({
        nombre: 'Nuevo Agente',
        email: 'nuevo@example.com',
        password: 'Password123',
      }),
    );
    expect(await screen.findByText('Nuevo Agente')).toBeVisible();
  });
});
