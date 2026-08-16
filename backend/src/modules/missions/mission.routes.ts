import { Router } from 'express';
import { z } from 'zod';

import { parseInput, uuidPathSchema } from '../../shared/http/validation.js';
import { authenticate, requireRoles } from '../auth/auth.middleware.js';
import type { AuthService } from '../auth/auth.service.js';
import {
  MISSION_DANGER_LEVELS,
  MISSION_STATES,
  type MissionInput,
  type MissionRecord,
} from '../domain/domain.types.js';
import type { MissionService } from './mission.service.js';

function isValidDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const missionBodySchema = z
  .object({
    titulo: z.string().trim().min(1, 'El título es obligatorio.').max(160),
    descripcion: z.string().trim().min(1, 'La descripción es obligatoria.'),
    ubicacion: z.string().trim().min(1, 'La ubicación es obligatoria.').max(160),
    fecha: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Debe usar el formato YYYY-MM-DD.')
      .refine(isValidDate, 'Debe ser una fecha válida.'),
    nivel_peligro: z.enum(MISSION_DANGER_LEVELS),
    estado: z.enum(MISSION_STATES),
    superheroe_id: z.uuid('Debe ser un UUID válido.'),
  })
  .strict();

function toMissionInput(body: z.infer<typeof missionBodySchema>): MissionInput {
  return {
    titulo: body.titulo,
    descripcion: body.descripcion,
    ubicacion: body.ubicacion,
    fecha: new Date(`${body.fecha}T00:00:00.000Z`),
    nivelPeligro: body.nivel_peligro,
    estado: body.estado,
    superheroeId: body.superheroe_id,
  };
}

function serializeMission(mission: MissionRecord) {
  return {
    id: mission.id,
    titulo: mission.titulo,
    descripcion: mission.descripcion,
    ubicacion: mission.ubicacion,
    fecha: mission.fecha.toISOString().slice(0, 10),
    nivel_peligro: mission.nivelPeligro,
    estado: mission.estado,
    superheroe_id: mission.superheroeId,
    superheroe: mission.superheroe,
    created_at: mission.createdAt.toISOString(),
    updated_at: mission.updatedAt.toISOString(),
  };
}

export function createMissionRouter(authService: AuthService, missionService: MissionService) {
  const router = Router();

  router.use(authenticate(authService));

  router.get('/', async (_request, response) => {
    const missions = await missionService.list();
    response.status(200).json({
      data: missions.map(serializeMission),
      meta: { total: missions.length },
    });
  });

  router.get('/:id', async (request, response) => {
    const { id } = parseInput(uuidPathSchema, request.params);
    const mission = await missionService.getById(id);
    response.status(200).json({ data: serializeMission(mission) });
  });

  router.post('/', requireRoles('ADMIN'), async (request, response) => {
    const body = parseInput(missionBodySchema, request.body);
    const mission = await missionService.create(toMissionInput(body));
    response.status(201).json({ data: serializeMission(mission) });
  });

  router.put('/:id', requireRoles('ADMIN'), async (request, response) => {
    const { id } = parseInput(uuidPathSchema, request.params);
    const body = parseInput(missionBodySchema, request.body);
    const mission = await missionService.update(id, toMissionInput(body));
    response.status(200).json({ data: serializeMission(mission) });
  });

  router.delete('/:id', requireRoles('ADMIN'), async (request, response) => {
    const { id } = parseInput(uuidPathSchema, request.params);
    await missionService.delete(id);
    response.status(204).send();
  });

  return router;
}
