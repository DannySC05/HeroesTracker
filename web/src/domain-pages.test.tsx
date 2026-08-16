import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRoutes } from './App';
import * as authApi from './auth/auth.api';
import { AuthProvider } from './auth/AuthProvider';
import { AUTH_TOKEN_KEY } from './auth/auth.storage';
import type { AuthUser } from './auth/auth.types';
import * as domainApi from './domain/domain.api';
import type { Hero, Mission } from './domain/domain.types';

vi.mock('./auth/auth.api', () => ({
  loginRequest: vi.fn(),
  getCurrentUserRequest: vi.fn(),
  logoutRequest: vi.fn(),
}));

vi.mock('./domain/domain.api', () => ({
  listHeroes: vi.fn(),
  getHero: vi.fn(),
  createHero: vi.fn(),
  updateHero: vi.fn(),
  deleteHero: vi.fn(),
  searchHeroImages: vi.fn(),
  listMissions: vi.fn(),
  getMission: vi.fn(),
  createMission: vi.fn(),
  updateMission: vi.fn(),
  deleteMission: vi.fn(),
}));

const adminUser: AuthUser = {
  id: '1c4e018f-e338-46a8-aa33-c0ddfa95c002',
  nombre: 'Administrador General',
  email: 'admin@example.com',
  rol: 'ADMIN',
  activo: true,
};

const consultaUser: AuthUser = {
  ...adminUser,
  id: '1c4e018f-e338-46a8-aa33-c0ddfa95c003',
  nombre: 'Agente Consulta',
  rol: 'CONSULTA',
};

const hero: Hero = {
  id: '10000000-0000-4000-8000-000000000001',
  nombre: 'Spider-Man',
  nombre_real: 'Peter Parker',
  poder_principal: 'Sentido arácnido',
  nivel_poder: 82,
  imagen_url: 'https://example.com/spider-man.jpg',
  estado: 'ACTIVO',
  created_at: '2026-08-15T00:00:00.000Z',
  updated_at: '2026-08-15T00:00:00.000Z',
};

const mission: Mission = {
  id: '20000000-0000-4000-8000-000000000001',
  titulo: 'Defensa de Nueva York',
  descripcion: 'Detener una amenaza tecnológica.',
  ubicacion: 'Nueva York',
  fecha: '2026-08-20',
  nivel_peligro: 'ALTO',
  estado: 'EN_PROGRESO',
  superheroe_id: hero.id,
  superheroe: { id: hero.id, nombre: hero.nombre },
  created_at: '2026-08-15T00:00:00.000Z',
  updated_at: '2026-08-15T00:00:00.000Z',
};

function renderPrivate(path: string, user: AuthUser = adminUser) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, 'jwt-persistido');
  vi.mocked(authApi.getCurrentUserRequest).mockResolvedValue(user);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('módulos web del Hito 7', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(domainApi.listHeroes).mockResolvedValue([hero]);
    vi.mocked(domainApi.getHero).mockResolvedValue(hero);
    vi.mocked(domainApi.searchHeroImages).mockResolvedValue({
      candidates: [],
      automaticSelectionId: null,
    });
    vi.mocked(domainApi.listMissions).mockResolvedValue([mission]);
    vi.mocked(domainApi.getMission).mockResolvedValue(mission);
  });

  it.each([
    ['ADMIN', adminUser],
    ['CONSULTA', consultaUser],
  ])('muestra el resumen operativo para el perfil %s', async (_role, authenticatedUser) => {
    vi.mocked(domainApi.listHeroes).mockResolvedValue([
      hero,
      { ...hero, id: '10000000-0000-4000-8000-000000000002', nombre: 'Iron Man' },
      {
        ...hero,
        id: '10000000-0000-4000-8000-000000000003',
        nombre: 'Hawkeye',
        estado: 'INACTIVO',
      },
    ]);
    vi.mocked(domainApi.listMissions).mockResolvedValue([
      mission,
      {
        ...mission,
        id: '20000000-0000-4000-8000-000000000002',
        titulo: 'Operación completada',
        estado: 'COMPLETADA',
      },
      {
        ...mission,
        id: '20000000-0000-4000-8000-000000000003',
        titulo: 'Operación completada II',
        estado: 'COMPLETADA',
      },
    ]);

    renderPrivate('/app', authenticatedUser);

    expect(await screen.findByText('Datos actualizados')).toBeVisible();

    const activeHeroes = screen.getByRole('link', { name: /Héroes activos/i });
    const completedMissions = screen.getByRole('link', { name: /Misiones completadas/i });
    const missionsInProgress = screen.getByRole('link', { name: /Misiones en progreso/i });

    expect(within(activeHeroes).getByText('2')).toBeVisible();
    expect(within(completedMissions).getByText('2')).toBeVisible();
    expect(within(missionsInProgress).getByText('1')).toBeVisible();
  });

  it('lista y busca héroes mediante la API', async () => {
    const user = userEvent.setup();
    renderPrivate('/app/heroes');

    expect(await screen.findByRole('heading', { name: 'Spider-Man' })).toBeVisible();
    await user.type(screen.getByLabelText('Buscar héroes por nombre'), 'Spider');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() => expect(domainApi.listHeroes).toHaveBeenLastCalledWith('Spider'));
  });

  it('muestra misiones activas en la tarjeta y el historial completado en el detalle', async () => {
    const completedMission: Mission = {
      ...mission,
      id: '20000000-0000-4000-8000-000000000003',
      titulo: 'Rescate completado',
      estado: 'COMPLETADA',
      fecha: '2026-08-10',
    };
    vi.mocked(domainApi.listMissions).mockResolvedValue([mission, completedMission]);
    const user = userEvent.setup();
    renderPrivate('/app/heroes');

    expect(await screen.findByText(mission.titulo)).toBeVisible();
    expect(screen.getByText('1', { selector: '.hero-card__missions strong' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Ver detalle' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Historial de misiones');
    expect(dialog).toHaveTextContent(completedMission.titulo);
  });

  it('permite a ADMIN crear un héroe desde el formulario', async () => {
    const createdHero = { ...hero, id: '10000000-0000-4000-8000-000000000002', nombre: 'Nova' };
    vi.mocked(domainApi.createHero).mockResolvedValue(createdHero);
    const user = userEvent.setup();
    renderPrivate('/app/heroes');

    await user.click(await screen.findByRole('button', { name: /Nuevo héroe/i }));
    await user.type(screen.getByLabelText('Nombre heroico'), 'Nova');
    await user.type(screen.getByLabelText('Nombre real'), 'Richard Rider');
    await user.type(screen.getByLabelText('Poder principal'), 'Energía Nova');
    await user.clear(screen.getByLabelText('Nivel de poder'));
    await user.type(screen.getByLabelText('Nivel de poder'), '90');
    await user.type(screen.getByLabelText('URL de imagen'), 'https://example.com/nova.jpg');
    await user.click(screen.getByRole('button', { name: 'Crear héroe' }));

    await waitFor(() =>
      expect(domainApi.createHero).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Nova', nivel_poder: 90 }),
      ),
    );
    expect(await screen.findByText('Héroe creado correctamente.')).toBeVisible();
  });

  it('busca y asigna automáticamente una coincidencia exacta sin reemplazar imágenes existentes', async () => {
    const externalImage = 'https://example.com/external-spider-man.jpg';
    vi.mocked(domainApi.searchHeroImages).mockResolvedValue({
      candidates: [
        {
          id: '620',
          name: 'Spider-Man',
          full_name: 'Peter Parker',
          publisher: 'Marvel Comics',
          image_url: externalImage,
        },
      ],
      automaticSelectionId: '620',
    });
    const user = userEvent.setup();
    renderPrivate('/app/heroes');

    await user.click(await screen.findByRole('button', { name: /Nuevo héroe/i }));
    await user.type(screen.getByLabelText('Nombre heroico'), 'Spider-Man');
    await user.click(screen.getByLabelText('Nombre real'));

    await waitFor(() => expect(screen.getByLabelText('URL de imagen')).toHaveValue(externalImage));

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    await user.click(screen.getByRole('button', { name: 'Buscar imagen' }));

    await waitFor(() =>
      expect(screen.getByLabelText('URL de imagen')).toHaveValue(hero.imagen_url),
    );
  });

  it('mantiene a CONSULTA en modo de solo lectura', async () => {
    renderPrivate('/app/heroes', consultaUser);

    expect(await screen.findByText('Modo consulta')).toBeVisible();
    expect(screen.queryByRole('button', { name: /Nuevo héroe/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
  });

  it('carga misiones, muestra su relación y abre el detalle', async () => {
    const user = userEvent.setup();
    renderPrivate('/app/misiones');

    expect(await screen.findByRole('heading', { name: mission.titulo })).toBeVisible();
    expect(screen.getByText(hero.nombre)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Ver detalle' }));

    expect(await screen.findByRole('dialog')).toHaveTextContent('Nueva York');
    expect(domainApi.getMission).toHaveBeenCalledWith(mission.id);
  });

  it('permite a ADMIN crear una misión asociada a un héroe', async () => {
    const createdMission = {
      ...mission,
      id: '20000000-0000-4000-8000-000000000002',
      titulo: 'Operación Centinela',
    };
    vi.mocked(domainApi.createMission).mockResolvedValue(createdMission);
    const user = userEvent.setup();
    renderPrivate('/app/misiones');

    await user.click(await screen.findByRole('button', { name: /Nueva misión/i }));
    await user.type(screen.getByLabelText('Título'), 'Operación Centinela');
    await user.type(screen.getByLabelText('Descripción'), 'Proteger el perímetro principal.');
    await user.type(screen.getByLabelText('Ubicación'), 'Quito');
    await user.clear(screen.getByLabelText('Fecha'));
    await user.type(screen.getByLabelText('Fecha'), '2026-10-10');
    await user.selectOptions(screen.getByLabelText('Nivel de peligro'), 'ALTO');
    await user.click(screen.getByRole('button', { name: 'Crear misión' }));

    await waitFor(() =>
      expect(domainApi.createMission).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Operación Centinela',
          superheroe_id: hero.id,
          nivel_peligro: 'ALTO',
        }),
      ),
    );
    expect(await screen.findByText('Misión creada correctamente.')).toBeVisible();
  });

  it('presenta un estado recuperable cuando la API falla', async () => {
    vi.mocked(domainApi.listHeroes).mockRejectedValueOnce(new Error('Network error'));
    const user = userEvent.setup();
    renderPrivate('/app/heroes');

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los héroes');
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { name: hero.nombre })).toBeVisible();
  });
});
