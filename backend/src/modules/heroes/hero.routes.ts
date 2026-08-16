import { Router } from 'express';
import { z } from 'zod';

import { parseInput, uuidPathSchema } from '../../shared/http/validation.js';
import { authenticate, requireRoles } from '../auth/auth.middleware.js';
import type { AuthService } from '../auth/auth.service.js';
import { HERO_STATES, type HeroInput, type HeroRecord } from '../domain/domain.types.js';
import type { HeroService } from './hero.service.js';

const heroBodySchema = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio.').max(100),
    nombre_real: z.string().trim().min(1, 'El nombre real es obligatorio.').max(120),
    poder_principal: z.string().trim().min(1, 'El poder principal es obligatorio.').max(160),
    nivel_poder: z.number().int().min(1).max(100),
    imagen_url: z
      .string()
      .trim()
      .url('Debe ser una URL válida.')
      .refine((value) => /^https?:\/\//i.test(value), 'Debe usar el protocolo HTTP o HTTPS.')
      .nullable(),
    estado: z.enum(HERO_STATES),
  })
  .strict();

const heroQuerySchema = z
  .object({
    nombre: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

function toHeroInput(body: z.infer<typeof heroBodySchema>): HeroInput {
  return {
    nombre: body.nombre,
    nombreReal: body.nombre_real,
    poderPrincipal: body.poder_principal,
    nivelPoder: body.nivel_poder,
    imagenUrl: body.imagen_url,
    estado: body.estado,
  };
}

function serializeHero(hero: HeroRecord) {
  return {
    id: hero.id,
    nombre: hero.nombre,
    nombre_real: hero.nombreReal,
    poder_principal: hero.poderPrincipal,
    nivel_poder: hero.nivelPoder,
    imagen_url: hero.imagenUrl,
    estado: hero.estado,
    created_at: hero.createdAt.toISOString(),
    updated_at: hero.updatedAt.toISOString(),
  };
}

export function createHeroRouter(authService: AuthService, heroService: HeroService) {
  const router = Router();

  router.use(authenticate(authService));

  router.get('/', async (request, response) => {
    const query = parseInput(heroQuerySchema, request.query);
    const heroes = await heroService.list(query.nombre);

    response.status(200).json({
      data: heroes.map(serializeHero),
      meta: { total: heroes.length },
    });
  });

  router.get('/:id', async (request, response) => {
    const { id } = parseInput(uuidPathSchema, request.params);
    const hero = await heroService.getById(id);
    response.status(200).json({ data: serializeHero(hero) });
  });

  router.post('/', requireRoles('ADMIN'), async (request, response) => {
    const body = parseInput(heroBodySchema, request.body);
    const hero = await heroService.create(toHeroInput(body));
    response.status(201).json({ data: serializeHero(hero) });
  });

  router.put('/:id', requireRoles('ADMIN'), async (request, response) => {
    const { id } = parseInput(uuidPathSchema, request.params);
    const body = parseInput(heroBodySchema, request.body);
    const hero = await heroService.update(id, toHeroInput(body));
    response.status(200).json({ data: serializeHero(hero) });
  });

  router.delete('/:id', requireRoles('ADMIN'), async (request, response) => {
    const { id } = parseInput(uuidPathSchema, request.params);
    await heroService.delete(id);
    response.status(204).send();
  });

  return router;
}
