import { Router } from 'express';
import { z } from 'zod';

import { authenticate, requireRoles } from '../auth/auth.middleware.js';
import type { AuthService } from '../auth/auth.service.js';
import { parseInput, uuidPathSchema } from '../../shared/http/validation.js';
import type { PublicUser } from '../auth/auth.types.js';
import type { UserService } from './user.service.js';

const createUserSchema = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio.').max(100),
    email: z.string().trim().email('Debe ser un email válido.').max(254),
    password: z.string().min(8, 'Debe tener al menos 8 caracteres.').max(72),
  })
  .strict();

const updateUserSchema = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio.').max(100),
    email: z.string().trim().email('Debe ser un email válido.').max(254),
    password: z.string().min(8, 'Debe tener al menos 8 caracteres.').max(72).optional(),
    activo: z.boolean(),
  })
  .strict();

function serializeUser(user: PublicUser) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    activo: user.activo,
  };
}

export function createUserRouter(authService: AuthService, userService: UserService) {
  const router = Router();

  router.use(authenticate(authService), requireRoles('ADMIN'));

  router.get('/', async (_request, response) => {
    const users = await userService.list();
    response.status(200).json({
      data: users.map(serializeUser),
      meta: { total: users.length },
    });
  });

  router.post('/', async (request, response) => {
    const body = parseInput(createUserSchema, request.body);
    const user = await userService.create(body);
    response.status(201).json({ data: serializeUser(user) });
  });

  router.put('/:id', async (request, response) => {
    const { id } = parseInput(uuidPathSchema, request.params);
    const body = parseInput(updateUserSchema, request.body);
    const user = await userService.update(id, {
      nombre: body.nombre,
      email: body.email,
      activo: body.activo,
      ...(body.password ? { password: body.password } : {}),
    });
    response.status(200).json({ data: serializeUser(user) });
  });

  return router;
}
