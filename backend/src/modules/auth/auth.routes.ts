import { Router } from 'express';
import { z, type ZodType } from 'zod';

import { AppError } from '../../shared/errors/app-error.js';
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

function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Los datos enviados no son válidos.',
      result.error.issues.map((issue) => ({
        field: issue.path.length > 0 ? issue.path.join('.') : 'body',
        message: issue.message,
      })),
    );
  }

  return result.data;
}

export function createAuthRouter(authService: AuthService) {
  const router = Router();
  const requireAuthentication = authenticate(authService);

  router.post('/register', async (request, response) => {
    const input = parseBody(registerSchema, request.body);
    const user = await authService.register(input);

    response.status(201).json({
      data: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    });
  });

  router.post('/login', async (request, response) => {
    const input = parseBody(loginSchema, request.body);
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
      },
    });
  });

  router.post('/logout', requireAuthentication, async (request, response) => {
    await authService.logout(request.auth!);
    response.status(204).send();
  });

  return router;
}
