import { createApp } from './app.js';
import { authConfig } from './config/auth.js';
import { corsOrigins, env } from './config/env.js';
import { database } from './lib/database.js';
import { PostgresAuthRepository } from './modules/auth/postgres-auth.repository.js';
import { PostgresDomainRepository } from './modules/domain/postgres-domain.repository.js';

const app = createApp({
  authConfig,
  authRepository: new PostgresAuthRepository(database),
  domainRepository: new PostgresDomainRepository(database),
  corsOrigins,
});

const server = app.listen(env.PORT, () => {
  console.log(`API disponible en http://localhost:${env.PORT}/api`);
});

async function shutdown(signal: string) {
  console.log(`Señal ${signal} recibida. Cerrando el servidor.`);

  server.close(async () => {
    await database.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
