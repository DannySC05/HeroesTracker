import cors from 'cors';
import express from 'express';

import { createAuthRouter } from './modules/auth/auth.routes.js';
import { AuthService } from './modules/auth/auth.service.js';
import type { AuthConfig, AuthRepository } from './modules/auth/auth.types.js';
import type { DomainRepository } from './modules/domain/domain.types.js';
import { createHeroImageRouter } from './modules/hero-images/hero-image.routes.js';
import { HeroImageService } from './modules/hero-images/hero-image.service.js';
import type { HeroImageProvider } from './modules/hero-images/hero-image.types.js';
import { createHeroRouter } from './modules/heroes/hero.routes.js';
import { HeroService } from './modules/heroes/hero.service.js';
import { createMissionRouter } from './modules/missions/mission.routes.js';
import { MissionService } from './modules/missions/mission.service.js';
import { errorHandler, notFoundHandler } from './shared/http/error-handler.js';

export interface AppDependencies {
  authConfig: AuthConfig;
  authRepository: AuthRepository;
  domainRepository?: DomainRepository;
  heroImageProvider?: HeroImageProvider | undefined;
  corsOrigins?: string[];
}

export function createApp({
  authConfig,
  authRepository,
  domainRepository,
  heroImageProvider,
  corsOrigins = [],
}: AppDependencies) {
  const app = express();
  const authService = new AuthService(authRepository, authConfig);

  app.disable('x-powered-by');
  app.use(
    cors({
      origin: corsOrigins,
    }),
  );
  app.use(express.json());

  app.get('/api/health', (_request, response) => {
    response.status(200).json({
      data: {
        status: 'ok',
        service: 'heroes-tracker-backend',
      },
    });
  });

  app.use('/api/auth', createAuthRouter(authService));
  app.use(
    '/api/hero-images',
    createHeroImageRouter(authService, new HeroImageService(heroImageProvider)),
  );

  if (domainRepository) {
    app.use('/api/heroes', createHeroRouter(authService, new HeroService(domainRepository)));
    app.use(
      '/api/misiones',
      createMissionRouter(authService, new MissionService(domainRepository)),
    );
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
