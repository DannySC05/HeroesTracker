import { randomUUID } from 'node:crypto';

import { DuplicateEmailError } from '../../src/modules/auth/auth.errors.js';
import type {
  AuthRepository,
  CreateUserInput,
  RevokeTokenInput,
  UserRecord,
} from '../../src/modules/auth/auth.types.js';

export class InMemoryAuthRepository implements AuthRepository {
  private readonly users: UserRecord[] = [];
  private readonly revokedTokens = new Map<string, RevokeTokenInput>();

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    const duplicated = this.users.some((user) => user.email === input.email);

    if (duplicated) {
      throw new DuplicateEmailError();
    }

    const user: UserRecord = {
      id: randomUUID(),
      ...input,
    };
    this.users.push(user);
    return structuredClone(user);
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const user = this.users.find((candidate) => candidate.email === email);
    return user ? structuredClone(user) : null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const user = this.users.find((candidate) => candidate.id === id);
    return user ? structuredClone(user) : null;
  }

  async isTokenRevoked(jti: string): Promise<boolean> {
    return this.revokedTokens.has(jti);
  }

  async revokeToken(input: RevokeTokenInput): Promise<void> {
    this.revokedTokens.set(input.jti, structuredClone(input));
  }

  seedUser(user: UserRecord): void {
    this.users.push(structuredClone(user));
  }
}
