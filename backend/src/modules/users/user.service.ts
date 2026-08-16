import { hash } from 'bcryptjs';

import type { AuthConfig, AuthRepository, PublicUser, UserRecord } from '../auth/auth.types.js';
import { DuplicateEmailError } from '../auth/auth.errors.js';
import { AppError } from '../../shared/errors/app-error.js';

export interface CreateConsultationUserInput {
  nombre: string;
  email: string;
  password: string;
}

export interface UpdateConsultationUserCommand {
  nombre: string;
  email: string;
  password?: string;
  activo: boolean;
}

function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    activo: user.activo,
  };
}

function duplicateEmailError(): AppError {
  return new AppError(409, 'EMAIL_ALREADY_EXISTS', 'El email ya está registrado.');
}

export class UserService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly config: AuthConfig,
  ) {}

  async list(): Promise<PublicUser[]> {
    return (await this.repository.listConsultationUsers()).map((user) => toPublicUser(user));
  }

  async create(input: CreateConsultationUserInput): Promise<PublicUser> {
    try {
      return toPublicUser(
        await this.repository.createUser({
          nombre: input.nombre.trim(),
          email: input.email.trim().toLowerCase(),
          passwordHash: await hash(input.password, this.config.bcryptRounds),
          rol: 'CONSULTA',
          activo: true,
        }),
      );
    } catch (error) {
      if (error instanceof DuplicateEmailError) throw duplicateEmailError();
      throw error;
    }
  }

  async update(id: string, input: UpdateConsultationUserCommand): Promise<PublicUser> {
    try {
      const passwordHash = input.password
        ? await hash(input.password, this.config.bcryptRounds)
        : undefined;
      const user = await this.repository.updateConsultationUser(id, {
        nombre: input.nombre.trim(),
        email: input.email.trim().toLowerCase(),
        activo: input.activo,
        ...(passwordHash ? { passwordHash } : {}),
      });

      if (!user) {
        throw new AppError(404, 'RESOURCE_NOT_FOUND', 'El usuario de consulta no existe.');
      }

      return toPublicUser(user);
    } catch (error) {
      if (error instanceof DuplicateEmailError) throw duplicateEmailError();
      throw error;
    }
  }
}
