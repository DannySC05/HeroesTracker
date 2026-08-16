import type { RequestHandler } from 'express';

import { AppError } from '../../shared/errors/app-error.js';
import type { AuthService } from './auth.service.js';
import type { UserRole } from './auth.types.js';

export function authenticate(authService: AuthService): RequestHandler {
  return async (request, _response, next) => {
    const authorization = request.get('authorization');
    const [scheme, token, ...extraParts] = authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token || extraParts.length > 0) {
      throw new AppError(
        401,
        'AUTHENTICATION_REQUIRED',
        'Se requiere un token válido para acceder a este recurso.',
      );
    }

    request.auth = await authService.authenticate(token);
    next();
  };
}

export function requireRoles(...allowedRoles: UserRole[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth) {
      throw new AppError(
        401,
        'AUTHENTICATION_REQUIRED',
        'Se requiere autenticación para acceder a este recurso.',
      );
    }

    if (!allowedRoles.includes(request.auth.user.rol)) {
      throw new AppError(403, 'FORBIDDEN', 'No tiene permisos para realizar esta operación.');
    }

    next();
  };
}
