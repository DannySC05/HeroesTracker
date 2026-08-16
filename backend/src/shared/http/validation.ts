import { z, type ZodType } from 'zod';

import { AppError } from '../errors/app-error.js';

export function parseInput<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);

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

export const uuidPathSchema = z.object({ id: z.uuid('Debe ser un UUID válido.') });
