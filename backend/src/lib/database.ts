import { Pool } from 'pg';

import { env } from '../config/env.js';

export const database = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
});

database.on('error', (error) => {
  console.error('Error inesperado en una conexión PostgreSQL inactiva.', error);
});
