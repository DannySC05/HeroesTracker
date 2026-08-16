export const USER_ROLES = ['ADMIN', 'CONSULTA'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface UserRecord {
  id: string;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: UserRole;
}

export type PublicUser = Omit<UserRecord, 'passwordHash'>;

export interface CreateUserInput {
  nombre: string;
  email: string;
  passwordHash: string;
  rol: UserRole;
}

export interface RevokeTokenInput {
  jti: string;
  usuarioId: string;
  expiraEn: Date;
}

export interface AuthRepository {
  createUser(input: CreateUserInput): Promise<UserRecord>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
  isTokenRevoked(jti: string): Promise<boolean>;
  revokeToken(input: RevokeTokenInput): Promise<void>;
}

export interface AuthConfig {
  bcryptRounds: number;
  jwtExpiresInSeconds: number;
  jwtSecret: string;
}

export interface AuthContext {
  token: string;
  jti: string;
  expiresAt: Date;
  user: PublicUser;
}
