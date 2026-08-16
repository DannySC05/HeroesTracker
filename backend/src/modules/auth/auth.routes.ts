import { Router } from 'express';
import { z } from 'zod';

import { parseInput } from '../../shared/http/validation.js';
import { authenticate } from './auth.middleware.js';
import type { AuthService } from './auth.service.js';

const registerSchema = z
  .object({
    nombre: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(72),
  })
  .strict();

const loginSchema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(72),
  })
  .strict();

export function createAuthRouter(authService: AuthService) {
  const router = Router();
  const requireAuthentication = authenticate(authService);

  router.post('/register', async (request, response) => {
    const input = parseInput(registerSchema, request.body);
    const user = await authService.register(input);

    response.status(201).json({
      data: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        activo: user.activo,
      },
    });
  });

  router.post('/login', async (request, response) => {
    const input = parseInput(loginSchema, request.body);
    const result = await authService.login(input);

    response.status(200).json({
      data: {
        token: result.token,
        expires_in: result.expiresIn,
        usuario: {
          id: result.user.id,
          nombre: result.user.nombre,
          email: result.user.email,
          rol: result.user.rol,
          activo: result.user.activo,
        },
      },
    });
  });

  router.get('/me', requireAuthentication, (request, response) => {
    const user = request.auth!.user;

    response.status(200).json({
      data: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        activo: user.activo,
      },
    });
  });

  router.post('/logout', requireAuthentication, async (request, response) => {
    await authService.logout(request.auth!);
    response.status(204).send();
  });

  return router;
}
