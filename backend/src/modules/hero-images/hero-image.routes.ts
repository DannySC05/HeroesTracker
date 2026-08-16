import { Router } from 'express';
import { z } from 'zod';

import { parseInput } from '../../shared/http/validation.js';
import { authenticate, requireRoles } from '../auth/auth.middleware.js';
import type { AuthService } from '../auth/auth.service.js';
import type { HeroImageService } from './hero-image.service.js';

const searchQuerySchema = z
  .object({
    name: z.string().trim().min(2, 'Escribe al menos dos caracteres.').max(100),
  })
  .strict();

export function createHeroImageRouter(
  authService: AuthService,
  heroImageService: HeroImageService,
) {
  const router = Router();

  router.use(authenticate(authService), requireRoles('ADMIN'));

  router.get('/', async (request, response) => {
    const { name } = parseInput(searchQuerySchema, request.query);
    const result = await heroImageService.search(name);

    response.status(200).json({
      data: result.candidates.map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        full_name: candidate.fullName,
        publisher: candidate.publisher,
        image_url: candidate.imageUrl,
      })),
      meta: {
        total: result.candidates.length,
        automatic_selection_id: result.automaticSelectionId,
      },
    });
  });

  return router;
}
