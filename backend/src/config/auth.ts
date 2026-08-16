import type { AuthConfig } from '../modules/auth/auth.types.js';
import { env } from './env.js';

const durationUnits = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
} as const;

function parseDurationInSeconds(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);

  if (!match) {
    throw new Error('JWT_EXPIRES_IN debe usar un formato como 30m, 2h o 1d.');
  }

  const amount = Number(match[1]);
  const unit = match[2] as keyof typeof durationUnits;

  return amount * durationUnits[unit];
}

export const authConfig: AuthConfig = {
  bcryptRounds: env.BCRYPT_ROUNDS,
  jwtExpiresInSeconds: parseDurationInSeconds(env.JWT_EXPIRES_IN),
  jwtSecret: env.JWT_SECRET,
};
