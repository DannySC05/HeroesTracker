import 'dotenv/config';

import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error('La variable DATABASE_URL es obligatoria para comprobar PostgreSQL.');
}

const database = new Pool({ connectionString, connectionTimeoutMillis: 10_000 });

try {
  const result = await database.query<{ table_name: string }>(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = ANY($1::text[])
     ORDER BY table_name`,
    [['heroes', 'misiones', 'tokens_revocados', 'usuarios']],
  );

  const expectedTables = ['heroes', 'misiones', 'tokens_revocados', 'usuarios'];
  const actualTables = result.rows.map(({ table_name }) => table_name);
  const missingTables = expectedTables.filter((table) => !actualTables.includes(table));

  if (missingTables.length > 0) {
    throw new Error(`Faltan tablas del proyecto: ${missingTables.join(', ')}.`);
  }

  console.log(`Conexión correcta. Tablas encontradas: ${actualTables.join(', ')}.`);
} finally {
  await database.end();
}
