import { randomUUID } from 'node:crypto';

import { compare, hash } from 'bcryptjs';
import { jwtVerify, SignJWT, type JWTPayload } from 'jose';

import { AppError } from '../../shared/errors/app-error.js';
import { DuplicateEmailError } from './auth.errors.js';
import {
  USER_ROLES,
  type AuthConfig,
  type AuthContext,
  type AuthRepository,
  type PublicUser,
  type UserRecord,
  type UserRole,
} from './auth.types.js';

export interface RegisterInput {
  nombre: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  expiresIn: number;
  user: PublicUser;
}

interface AccessTokenPayload extends JWTPayload {
  rol?: string;
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

function authenticationError(): AppError {
  return new AppError(
    401,
    'AUTHENTICATION_REQUIRED',
    'Se requiere un token válido para acceder a este recurso.',
  );
}

export class AuthService {
  private readonly jwtKey: Uint8Array;

  constructor(
    private readonly repository: AuthRepository,
    private readonly config: AuthConfig,
  ) {
    this.jwtKey = new TextEncoder().encode(config.jwtSecret);
  }

  async register(input: RegisterInput): Promise<PublicUser> {
    const email = input.email.trim().toLowerCase();
    const existingUser = await this.repository.findUserByEmail(email);

    if (existingUser) {
      throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'El email ya está registrado.');
    }

    const passwordHash = await hash(input.password, this.config.bcryptRounds);

    try {
      const user = await this.repository.createUser({
        nombre: input.nombre.trim(),
        email,
        passwordHash,
        rol: 'CONSULTA',
        activo: true,
      });

      return toPublicUser(user);
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'El email ya está registrado.');
      }

      throw error;
    }
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const email = input.email.trim().toLowerCase();
    const user = await this.repository.findUserByEmail(email);
    const credentialsAreValid = user?.activo
      ? await compare(input.password, user.passwordHash)
      : false;

    if (!user || !credentialsAreValid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email o contraseña incorrectos.');
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + this.config.jwtExpiresInSeconds;
    const token = await new SignJWT({ rol: user.rol })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(user.id)
      .setJti(randomUUID())
      .setIssuedAt(issuedAt)
      .setExpirationTime(expiresAt)
      .sign(this.jwtKey);

    return {
      token,
      expiresIn: this.config.jwtExpiresInSeconds,
      user: toPublicUser(user),
    };
  }

  async authenticate(token: string): Promise<AuthContext> {
    let payload: AccessTokenPayload;

    try {
      const verification = await jwtVerify<AccessTokenPayload>(token, this.jwtKey, {
        algorithms: ['HS256'],
      });
      payload = verification.payload;
    } catch {
      throw authenticationError();
    }

    if (
      !payload.sub ||
      !payload.jti ||
      !payload.exp ||
      !USER_ROLES.includes(payload.rol as UserRole)
    ) {
      throw authenticationError();
    }

    if (await this.repository.isTokenRevoked(payload.jti)) {
      throw authenticationError();
    }

    const user = await this.repository.findUserById(payload.sub);

    if (!user || !user.activo) {
      throw authenticationError();
    }

    return {
      token,
      jti: payload.jti,
      expiresAt: new Date(payload.exp * 1000),
      user: toPublicUser(user),
    };
  }

  async logout(context: AuthContext): Promise<void> {
    await this.repository.revokeToken({
      jti: context.jti,
      usuarioId: context.user.id,
      expiraEn: context.expiresAt,
    });
  }
}
