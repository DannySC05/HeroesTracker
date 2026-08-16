import type { PrismaClient } from '../../generated/prisma/client.ts';

import { DuplicateEmailError } from './auth.errors.js';
import type {
  AuthRepository,
  CreateUserInput,
  RevokeTokenInput,
  UserRecord,
  UserRole,
} from './auth.types.js';

interface PrismaErrorWithCode {
  code?: string;
}

function toUserRecord(user: {
  id: string;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: string;
}): UserRecord {
  return {
    ...user,
    rol: user.rol as UserRole,
  };
}

export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    try {
      const user = await this.prisma.usuario.create({
        data: input,
        select: {
          id: true,
          nombre: true,
          email: true,
          passwordHash: true,
          rol: true,
        },
      });

      return toUserRecord(user);
    } catch (error) {
      if ((error as PrismaErrorWithCode).code === 'P2002') {
        throw new DuplicateEmailError();
      }

      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const user = await this.prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        nombre: true,
        email: true,
        passwordHash: true,
        rol: true,
      },
    });

    return user ? toUserRecord(user) : null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        email: true,
        passwordHash: true,
        rol: true,
      },
    });

    return user ? toUserRecord(user) : null;
  }

  async isTokenRevoked(jti: string): Promise<boolean> {
    const token = await this.prisma.tokenRevocado.findUnique({
      where: { jti },
      select: { jti: true },
    });

    return token !== null;
  }

  async revokeToken(input: RevokeTokenInput): Promise<void> {
    await this.prisma.tokenRevocado.create({
      data: input,
    });
  }
}
