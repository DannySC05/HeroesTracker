import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';

import { PrismaClient } from '../../backend/src/generated/prisma/client.ts';
import {
  EstadoHeroe,
  EstadoMision,
  NivelPeligro,
  RolUsuario,
} from '../../backend/src/generated/prisma/enums.ts';

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

const rounds = Number(process.env.BCRYPT_ROUNDS ?? '12');

if (!Number.isInteger(rounds) || rounds < 10 || rounds > 15) {
  throw new Error('BCRYPT_ROUNDS debe ser un entero entre 10 y 15.');
}

const connectionString = requiredEnvironment('DATABASE_URL');
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const usuarios = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    nombre: 'Administrador Marvel',
    email: seedEmail('SEED_ADMIN_EMAIL'),
    password: seedPassword('SEED_ADMIN_PASSWORD'),
    rol: RolUsuario.ADMIN,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    nombre: 'Usuario Consulta',
    email: seedEmail('SEED_CONSULTA_EMAIL'),
    password: seedPassword('SEED_CONSULTA_PASSWORD'),
    rol: RolUsuario.CONSULTA,
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
    estado: EstadoHeroe.ACTIVO,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    nombre: 'Iron Man',
    nombreReal: 'Tony Stark',
    poderPrincipal: 'Armadura tecnológica avanzada',
    nivelPoder: 88,
    imagenUrl: 'https://placehold.co/600x400/b91c1c/facc15?text=Iron+Man',
    estado: EstadoHeroe.ACTIVO,
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    nombre: 'Thor',
    nombreReal: 'Thor Odinson',
    poderPrincipal: 'Control del trueno',
    nivelPoder: 96,
    imagenUrl: 'https://placehold.co/600x400/1d4ed8/ffffff?text=Thor',
    estado: EstadoHeroe.ACTIVO,
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    nombre: 'Hulk',
    nombreReal: 'Bruce Banner',
    poderPrincipal: 'Fuerza sobrehumana',
    nivelPoder: 98,
    imagenUrl: 'https://placehold.co/600x400/166534/ffffff?text=Hulk',
    estado: EstadoHeroe.ACTIVO,
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    nombre: 'Doctor Strange',
    nombreReal: 'Stephen Strange',
    poderPrincipal: 'Artes místicas',
    nivelPoder: 92,
    imagenUrl: 'https://placehold.co/600x400/7e22ce/ffffff?text=Doctor+Strange',
    estado: EstadoHeroe.ACTIVO,
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    nombre: 'Black Panther',
    nombreReal: "T'Challa",
    poderPrincipal: 'Sentidos y fuerza mejorados',
    nivelPoder: 79,
    imagenUrl: 'https://placehold.co/600x400/18181b/a78bfa?text=Black+Panther',
    estado: EstadoHeroe.ACTIVO,
  },
  {
    id: '10000000-0000-4000-8000-000000000007',
    nombre: 'Captain Marvel',
    nombreReal: 'Carol Danvers',
    poderPrincipal: 'Manipulación de energía cósmica',
    nivelPoder: 97,
    imagenUrl: 'https://placehold.co/600x400/1e3a8a/facc15?text=Captain+Marvel',
    estado: EstadoHeroe.ACTIVO,
  },
  {
    id: '10000000-0000-4000-8000-000000000008',
    nombre: 'Scarlet Witch',
    nombreReal: 'Wanda Maximoff',
    poderPrincipal: 'Manipulación de la realidad',
    nivelPoder: 99,
    imagenUrl: 'https://placehold.co/600x400/9f1239/ffffff?text=Scarlet+Witch',
    estado: EstadoHeroe.INACTIVO,
  },
] as const;

const misiones = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    titulo: 'Defensa de Nueva York',
    descripcion: 'Detener una amenaza tecnológica que afecta el centro de la ciudad.',
    ubicacion: 'Nueva York',
    fecha: new Date('2026-08-20T00:00:00.000Z'),
    nivelPeligro: NivelPeligro.ALTO,
    estado: EstadoMision.EN_PROGRESO,
    superheroeId: heroes[0].id,
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    titulo: 'Protocolo Armadura',
    descripcion: 'Recuperar tecnología robada antes de que sea replicada.',
    ubicacion: 'Malibú',
    fecha: new Date('2026-08-22T00:00:00.000Z'),
    nivelPeligro: NivelPeligro.MEDIO,
    estado: EstadoMision.PENDIENTE,
    superheroeId: heroes[1].id,
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    titulo: 'Tormenta en Asgard',
    descripcion: 'Restablecer el equilibrio tras una anomalía dimensional.',
    ubicacion: 'Asgard',
    fecha: new Date('2026-08-25T00:00:00.000Z'),
    nivelPeligro: NivelPeligro.ALTO,
    estado: EstadoMision.PENDIENTE,
    superheroeId: heroes[2].id,
  },
  {
    id: '20000000-0000-4000-8000-000000000004',
    titulo: 'Contención Gamma',
    descripcion: 'Asegurar material radiactivo en una instalación abandonada.',
    ubicacion: 'Desierto de Nevada',
    fecha: new Date('2026-08-28T00:00:00.000Z'),
    nivelPeligro: NivelPeligro.ALTO,
    estado: EstadoMision.COMPLETADA,
    superheroeId: heroes[3].id,
  },
  {
    id: '20000000-0000-4000-8000-000000000005',
    titulo: 'Portal Inestable',
    descripcion: 'Cerrar un portal que conecta con una dimensión desconocida.',
    ubicacion: 'Katmandú',
    fecha: new Date('2026-09-02T00:00:00.000Z'),
    nivelPeligro: NivelPeligro.MEDIO,
    estado: EstadoMision.EN_PROGRESO,
    superheroeId: heroes[4].id,
  },
  {
    id: '20000000-0000-4000-8000-000000000006',
    titulo: 'Vibranium Perdido',
    descripcion: 'Localizar un cargamento de vibranium desaparecido.',
    ubicacion: 'Wakanda',
    fecha: new Date('2026-09-05T00:00:00.000Z'),
    nivelPeligro: NivelPeligro.BAJO,
    estado: EstadoMision.PENDIENTE,
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

  await prisma.$transaction(async (transaction) => {
    for (const { usuario, passwordHash } of passwordHashes) {
      await transaction.usuario.upsert({
        where: { email: usuario.email },
        create: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          passwordHash,
          rol: usuario.rol,
        },
        update: {
          nombre: usuario.nombre,
          passwordHash,
          rol: usuario.rol,
        },
      });
    }

    for (const heroe of heroes) {
      await transaction.heroe.upsert({
        where: { nombre: heroe.nombre },
        create: heroe,
        update: {
          nombreReal: heroe.nombreReal,
          poderPrincipal: heroe.poderPrincipal,
          nivelPoder: heroe.nivelPoder,
          imagenUrl: heroe.imagenUrl,
          estado: heroe.estado,
        },
      });
    }

    for (const mision of misiones) {
      await transaction.mision.upsert({
        where: { id: mision.id },
        create: mision,
        update: {
          titulo: mision.titulo,
          descripcion: mision.descripcion,
          ubicacion: mision.ubicacion,
          fecha: mision.fecha,
          nivelPeligro: mision.nivelPeligro,
          estado: mision.estado,
          superheroeId: mision.superheroeId,
        },
      });
    }
  });

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
    await prisma.$disconnect();
  });
