import { createApp } from './app.js';
import { authConfig } from './config/auth.js';
import { corsOrigins, env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { PrismaAuthRepository } from './modules/auth/prisma-auth.repository.js';
import { PrismaDomainRepository } from './modules/domain/prisma-domain.repository.js';

const app = createApp({
  authConfig,
  authRepository: new PrismaAuthRepository(prisma),
  domainRepository: new PrismaDomainRepository(prisma),
  corsOrigins,
});

const server = app.listen(env.PORT, () => {
  console.log(`API disponible en http://localhost:${env.PORT}/api`);
});

async function shutdown(signal: string) {
  console.log(`Señal ${signal} recibida. Cerrando el servidor.`);

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
