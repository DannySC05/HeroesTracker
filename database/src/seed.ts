import 'dotenv/config';

import { hash } from 'bcryptjs';
import { Pool } from 'pg';

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`La variable ${name} es obligatoria para ejecutar el seed.`);
  }

  return value;
}

function seedPassword(name: string): string {
  const value = requiredEnvironment(name);

  if (value.length < 8) {
    throw new Error(`La variable ${name} debe tener al menos 8 caracteres.`);
  }

  return value;
}

function seedEmail(name: string): string {
  const value = requiredEnvironment(name).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error(`La variable ${name} no contiene un email válido.`);
  }

  return value;
}

function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

const rounds = Number(process.env.BCRYPT_ROUNDS ?? '12');

if (!Number.isInteger(rounds) || rounds < 10 || rounds > 15) {
  throw new Error('BCRYPT_ROUNDS debe ser un entero entre 10 y 15.');
}

const connectionString = requiredEnvironment('DATABASE_URL');
const database = new Pool({ connectionString });

const usuarios = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    nombre: 'Administrador Marvel',
    email: seedEmail('SEED_ADMIN_EMAIL'),
    password: seedPassword('SEED_ADMIN_PASSWORD'),
    rol: 'ADMIN',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    nombre: 'Usuario Consulta',
    email: seedEmail('SEED_CONSULTA_EMAIL'),
    password: seedPassword('SEED_CONSULTA_PASSWORD'),
    rol: 'CONSULTA',
  },
] as const;

const heroes = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    nombre: 'Spider-Man',
    nombreReal: 'Peter Parker',
    poderPrincipal: 'Sentido arácnido y agilidad sobrehumana',
    nivelPoder: 82,
    imagenUrl: 'https://placehold.co/600x400/991b1b/ffffff?text=Spider-Man',
    estado: 'ACTIVO',
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    nombre: 'Iron Man',
    nombreReal: 'Tony Stark',
    poderPrincipal: 'Armadura tecnológica avanzada',
    nivelPoder: 88,
    imagenUrl: 'https://placehold.co/600x400/b91c1c/facc15?text=Iron+Man',
    estado: 'ACTIVO',
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    nombre: 'Thor',
    nombreReal: 'Thor Odinson',
    poderPrincipal: 'Control del trueno',
    nivelPoder: 96,
    imagenUrl: 'https://placehold.co/600x400/1d4ed8/ffffff?text=Thor',
    estado: 'ACTIVO',
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    nombre: 'Hulk',
    nombreReal: 'Bruce Banner',
    poderPrincipal: 'Fuerza sobrehumana',
    nivelPoder: 98,
    imagenUrl: 'https://placehold.co/600x400/166534/ffffff?text=Hulk',
    estado: 'ACTIVO',
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    nombre: 'Doctor Strange',
    nombreReal: 'Stephen Strange',
    poderPrincipal: 'Artes místicas',
    nivelPoder: 92,
    imagenUrl: 'https://placehold.co/600x400/7e22ce/ffffff?text=Doctor+Strange',
    estado: 'ACTIVO',
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    nombre: 'Black Panther',
    nombreReal: "T'Challa",
    poderPrincipal: 'Sentidos y fuerza mejorados',
    nivelPoder: 79,
    imagenUrl: 'https://placehold.co/600x400/18181b/a78bfa?text=Black+Panther',
    estado: 'ACTIVO',
  },
  {
    id: '10000000-0000-4000-8000-000000000007',
    nombre: 'Captain Marvel',
    nombreReal: 'Carol Danvers',
    poderPrincipal: 'Manipulación de energía cósmica',
    nivelPoder: 97,
    imagenUrl: 'https://placehold.co/600x400/1e3a8a/facc15?text=Captain+Marvel',
    estado: 'ACTIVO',
  },
  {
    id: '10000000-0000-4000-8000-000000000008',
    nombre: 'Scarlet Witch',
    nombreReal: 'Wanda Maximoff',
    poderPrincipal: 'Manipulación de la realidad',
    nivelPoder: 99,
    imagenUrl: 'https://placehold.co/600x400/9f1239/ffffff?text=Scarlet+Witch',
    estado: 'INACTIVO',
  },
] as const;

const misiones = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    titulo: 'Defensa de Nueva York',
    descripcion: 'Detener una amenaza tecnológica que afecta el centro de la ciudad.',
    ubicacion: 'Nueva York',
    fecha: new Date('2026-08-20T00:00:00.000Z'),
    nivelPeligro: 'ALTO',
    estado: 'EN_PROGRESO',
    superheroeId: heroes[0].id,
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    titulo: 'Protocolo Armadura',
    descripcion: 'Recuperar tecnología robada antes de que sea replicada.',
    ubicacion: 'Malibú',
    fecha: new Date('2026-08-22T00:00:00.000Z'),
    nivelPeligro: 'MEDIO',
    estado: 'PENDIENTE',
    superheroeId: heroes[1].id,
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    titulo: 'Tormenta en Asgard',
    descripcion: 'Restablecer el equilibrio tras una anomalía dimensional.',
    ubicacion: 'Asgard',
    fecha: new Date('2026-08-25T00:00:00.000Z'),
    nivelPeligro: 'ALTO',
    estado: 'PENDIENTE',
    superheroeId: heroes[2].id,
  },
  {
    id: '20000000-0000-4000-8000-000000000004',
    titulo: 'Contención Gamma',
    descripcion: 'Asegurar material radiactivo en una instalación abandonada.',
    ubicacion: 'Desierto de Nevada',
    fecha: new Date('2026-08-28T00:00:00.000Z'),
    nivelPeligro: 'ALTO',
    estado: 'COMPLETADA',
    superheroeId: heroes[3].id,
  },
  {
    id: '20000000-0000-4000-8000-000000000005',
    titulo: 'Portal Inestable',
    descripcion: 'Cerrar un portal que conecta con una dimensión desconocida.',
    ubicacion: 'Katmandú',
    fecha: new Date('2026-09-02T00:00:00.000Z'),
    nivelPeligro: 'MEDIO',
    estado: 'EN_PROGRESO',
    superheroeId: heroes[4].id,
  },
  {
    id: '20000000-0000-4000-8000-000000000006',
    titulo: 'Vibranium Perdido',
    descripcion: 'Localizar un cargamento de vibranium desaparecido.',
    ubicacion: 'Wakanda',
    fecha: new Date('2026-09-05T00:00:00.000Z'),
    nivelPeligro: 'BAJO',
    estado: 'PENDIENTE',
    superheroeId: heroes[5].id,
  },
] as const;

async function main() {
  const passwordHashes = await Promise.all(
    usuarios.map(async (usuario) => ({
      usuario,
      passwordHash: await hash(usuario.password, rounds),
    })),
  );

  const client = await database.connect();

  try {
    await client.query('BEGIN');

    for (const { usuario, passwordHash } of passwordHashes) {
      await client.query(
        `INSERT INTO usuarios (id, nombre, email, password_hash, rol, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         ON CONFLICT (email) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           password_hash = EXCLUDED.password_hash,
           rol = EXCLUDED.rol,
           updated_at = CURRENT_TIMESTAMP`,
        [usuario.id, usuario.nombre, usuario.email, passwordHash, usuario.rol],
      );
    }

    for (const heroe of heroes) {
      await client.query(
        `INSERT INTO heroes
           (id, nombre, nombre_real, poder_principal, nivel_poder, imagen_url, estado, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
         ON CONFLICT (nombre) DO UPDATE SET
           nombre_real = EXCLUDED.nombre_real,
           poder_principal = EXCLUDED.poder_principal,
           nivel_poder = EXCLUDED.nivel_poder,
           imagen_url = EXCLUDED.imagen_url,
           estado = EXCLUDED.estado,
           updated_at = CURRENT_TIMESTAMP`,
        [
          heroe.id,
          heroe.nombre,
          heroe.nombreReal,
          heroe.poderPrincipal,
          heroe.nivelPoder,
          heroe.imagenUrl,
          heroe.estado,
        ],
      );
    }

    for (const mision of misiones) {
      await client.query(
        `INSERT INTO misiones
           (id, titulo, descripcion, ubicacion, fecha, nivel_peligro, estado, superheroe_id, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           titulo = EXCLUDED.titulo,
           descripcion = EXCLUDED.descripcion,
           ubicacion = EXCLUDED.ubicacion,
           fecha = EXCLUDED.fecha,
           nivel_peligro = EXCLUDED.nivel_peligro,
           estado = EXCLUDED.estado,
           superheroe_id = EXCLUDED.superheroe_id,
           updated_at = CURRENT_TIMESTAMP`,
        [
          mision.id,
          mision.titulo,
          mision.descripcion,
          mision.ubicacion,
          toDateOnly(mision.fecha),
          mision.nivelPeligro,
          mision.estado,
          mision.superheroeId,
        ],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  console.log(
    `Seed completado: ${usuarios.length} usuarios, ${heroes.length} héroes y ${misiones.length} misiones.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('No se pudo ejecutar el seed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.end();
  });
