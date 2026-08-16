import { randomUUID } from 'node:crypto';

import { hash } from 'bcryptjs';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import type { AuthConfig } from '../src/modules/auth/auth.types.js';
import type { HeroImageProvider } from '../src/modules/hero-images/hero-image.types.js';
import { InMemoryAuthRepository } from './support/in-memory-auth.repository.js';
import { InMemoryDomainRepository } from './support/in-memory-domain.repository.js';

const authConfig: AuthConfig = {
  bcryptRounds: 4,
  jwtExpiresInSeconds: 7200,
  jwtSecret: 'test-secret-with-at-least-thirty-two-characters-long',
};

const adminCredentials = { email: 'admin@example.com', password: 'AdminPassword123' };
const consultaCredentials = { email: 'consulta@example.com', password: 'ConsultaPassword123' };

const validHeroBody = {
  nombre: 'Wonder Woman',
  nombre_real: 'Diana Prince',
  poder_principal: 'Fuerza sobrehumana',
  nivel_poder: 91,
  imagen_url: 'https://example.com/wonder-woman.jpg',
  estado: 'ACTIVO',
};

describe('API de héroes y misiones', () => {
  let app: ReturnType<typeof createApp>;
  let domainRepository: InMemoryDomainRepository;
  let adminToken: string;
  let consultaToken: string;
  let spiderManId: string;
  let batmanId: string;
  let supermanId: string;
  let alphaMissionId: string;
  let adminPasswordHash: string;
  let consultaPasswordHash: string;

  beforeAll(async () => {
    [adminPasswordHash, consultaPasswordHash] = await Promise.all([
      hash(adminCredentials.password, authConfig.bcryptRounds),
      hash(consultaCredentials.password, authConfig.bcryptRounds),
    ]);
  });

  beforeEach(async () => {
    const authRepository = new InMemoryAuthRepository();
    authRepository.seedUser({
      id: randomUUID(),
      nombre: 'Administrador',
      email: adminCredentials.email,
      passwordHash: adminPasswordHash,
      rol: 'ADMIN',
    });
    authRepository.seedUser({
      id: randomUUID(),
      nombre: 'Consulta',
      email: consultaCredentials.email,
      passwordHash: consultaPasswordHash,
      rol: 'CONSULTA',
    });

    domainRepository = new InMemoryDomainRepository();
    spiderManId = domainRepository.seedHero({
      nombre: 'Spider-Man',
      nombreReal: 'Peter Parker',
      poderPrincipal: 'Sentido arácnido',
      nivelPoder: 82,
      imagenUrl: 'https://example.com/spider-man.jpg',
      estado: 'ACTIVO',
    }).id;
    batmanId = domainRepository.seedHero({
      nombre: 'Batman',
      nombreReal: 'Bruce Wayne',
      poderPrincipal: 'Estrategia',
      nivelPoder: 75,
      imagenUrl: 'https://example.com/batman.jpg',
      estado: 'ACTIVO',
    }).id;
    supermanId = domainRepository.seedHero({
      nombre: 'Superman',
      nombreReal: 'Clark Kent',
      poderPrincipal: 'Superfuerza',
      nivelPoder: 98,
      imagenUrl: 'https://example.com/superman.jpg',
      estado: 'INACTIVO',
    }).id;

    alphaMissionId = domainRepository.seedMission({
      titulo: 'Alpha',
      descripcion: 'Primera misión de la fecha.',
      ubicacion: 'Metrópolis',
      fecha: new Date('2026-09-10T00:00:00.000Z'),
      nivelPeligro: 'ALTO',
      estado: 'PENDIENTE',
      superheroeId: spiderManId,
    }).id;
    domainRepository.seedMission({
      titulo: 'Zulu',
      descripcion: 'Segunda misión de la fecha.',
      ubicacion: 'Gotham',
      fecha: new Date('2026-09-10T00:00:00.000Z'),
      nivelPeligro: 'MEDIO',
      estado: 'EN_PROGRESO',
      superheroeId: supermanId,
    });
    domainRepository.seedMission({
      titulo: 'Anterior',
      descripcion: 'Misión de una fecha anterior.',
      ubicacion: 'Queens',
      fecha: new Date('2026-08-01T00:00:00.000Z'),
      nivelPeligro: 'BAJO',
      estado: 'COMPLETADA',
      superheroeId: spiderManId,
    });

    const heroImageProvider: HeroImageProvider = {
      search: async (name) =>
        name === 'Spider-Man'
          ? [
              {
                id: '620',
                name: 'Spider-Man',
                fullName: 'Peter Parker',
                publisher: 'Marvel Comics',
                imageUrl: 'https://example.com/external-spider-man.jpg',
              },
            ]
          : [],
    };

    app = createApp({ authConfig, authRepository, domainRepository, heroImageProvider });

    const [adminLogin, consultaLogin] = await Promise.all([
      request(app).post('/api/auth/login').send(adminCredentials),
      request(app).post('/api/auth/login').send(consultaCredentials),
    ]);
    adminToken = adminLogin.body.data.token as string;
    consultaToken = consultaLogin.body.data.token as string;
  });

  const authorize = (token: string) => ({ Authorization: `Bearer ${token}` });

  function validMissionBody(superheroeId = spiderManId) {
    return {
      titulo: 'Defensa orbital',
      descripcion: 'Proteger la estación de una amenaza externa.',
      ubicacion: 'Órbita terrestre',
      fecha: '2026-10-20',
      nivel_peligro: 'ALTO',
      estado: 'PENDIENTE',
      superheroe_id: superheroeId,
    };
  }

  describe('autenticación y autorización', () => {
    it('rechaza los listados sin token', async () => {
      await request(app).get('/api/heroes').expect(401);
      await request(app).get('/api/misiones').expect(401);
    });

    it('permite a CONSULTA leer héroes y misiones', async () => {
      await request(app).get('/api/heroes').set(authorize(consultaToken)).expect(200);
      await request(app).get('/api/misiones').set(authorize(consultaToken)).expect(200);
    });

    it('impide a CONSULTA crear, actualizar y eliminar héroes', async () => {
      await request(app)
        .post('/api/heroes')
        .set(authorize(consultaToken))
        .send(validHeroBody)
        .expect(403);
      await request(app)
        .put(`/api/heroes/${batmanId}`)
        .set(authorize(consultaToken))
        .send(validHeroBody)
        .expect(403);
      await request(app)
        .delete(`/api/heroes/${batmanId}`)
        .set(authorize(consultaToken))
        .expect(403);
    });

    it('impide a CONSULTA crear, actualizar y eliminar misiones', async () => {
      await request(app)
        .post('/api/misiones')
        .set(authorize(consultaToken))
        .send(validMissionBody())
        .expect(403);
      await request(app)
        .put(`/api/misiones/${alphaMissionId}`)
        .set(authorize(consultaToken))
        .send(validMissionBody())
        .expect(403);
      await request(app)
        .delete(`/api/misiones/${alphaMissionId}`)
        .set(authorize(consultaToken))
        .expect(403);
    });
  });

  describe('héroes', () => {
    it('protege la búsqueda de imágenes y devuelve la selección automática', async () => {
      await request(app).get('/api/hero-images?name=Spider-Man').expect(401);
      await request(app)
        .get('/api/hero-images?name=Spider-Man')
        .set(authorize(consultaToken))
        .expect(403);

      const response = await request(app)
        .get('/api/hero-images?name=Spider-Man')
        .set(authorize(adminToken))
        .expect(200);

      expect(response.body.data[0]).toMatchObject({
        id: '620',
        name: 'Spider-Man',
        image_url: 'https://example.com/external-spider-man.jpg',
      });
      expect(response.body.meta.automatic_selection_id).toBe('620');
    });

    it('permite registrar un héroe original sin imagen', async () => {
      const response = await request(app)
        .post('/api/heroes')
        .set(authorize(adminToken))
        .send({ ...validHeroBody, nombre: 'Original Hero', imagen_url: null })
        .expect(201);

      expect(response.body.data.imagen_url).toBeNull();
    });

    it('lista por nombre ascendente con total y búsqueda parcial sin distinguir mayúsculas', async () => {
      const list = await request(app).get('/api/heroes').set(authorize(consultaToken)).expect(200);
      expect(list.body.meta.total).toBe(3);
      expect(list.body.data.map((hero: { nombre: string }) => hero.nombre)).toEqual([
        'Batman',
        'Spider-Man',
        'Superman',
      ]);

      const filtered = await request(app)
        .get('/api/heroes?nombre=SPIDER')
        .set(authorize(consultaToken))
        .expect(200);
      expect(filtered.body.meta.total).toBe(1);
      expect(filtered.body.data[0].id).toBe(spiderManId);
    });

    it('obtiene un héroe por UUID con campos snake_case', async () => {
      const response = await request(app)
        .get(`/api/heroes/${spiderManId}`)
        .set(authorize(consultaToken))
        .expect(200);
      expect(response.body.data).toMatchObject({
        id: spiderManId,
        nombre_real: 'Peter Parker',
        nivel_poder: 82,
      });
      expect(response.body.data.created_at).toEqual(expect.any(String));
    });

    it('rechaza un UUID de héroe inválido', async () => {
      const response = await request(app)
        .get('/api/heroes/no-es-uuid')
        .set(authorize(consultaToken))
        .expect(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details[0].field).toBe('id');
    });

    it('retorna 404 cuando el héroe no existe', async () => {
      const response = await request(app)
        .get(`/api/heroes/${randomUUID()}`)
        .set(authorize(consultaToken))
        .expect(404);
      expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('crea un héroe, recorta textos y devuelve 201', async () => {
      const response = await request(app)
        .post('/api/heroes')
        .set(authorize(adminToken))
        .send({ ...validHeroBody, nombre: '  Wonder Woman  ' })
        .expect(201);
      expect(response.body.data).toMatchObject({
        nombre: 'Wonder Woman',
        nombre_real: 'Diana Prince',
        estado: 'ACTIVO',
      });
      expect(await domainRepository.heroExists(response.body.data.id)).toBe(true);
    });

    it('valida todos los campos editables del héroe', async () => {
      const response = await request(app)
        .post('/api/heroes')
        .set(authorize(adminToken))
        .send({
          nombre: '',
          nombre_real: '',
          poder_principal: '',
          nivel_poder: 101,
          imagen_url: 'ftp://example.com/image.jpg',
          estado: 'DESCONOCIDO',
        })
        .expect(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.map((detail: { field: string }) => detail.field)).toEqual(
        expect.arrayContaining([
          'nombre',
          'nombre_real',
          'poder_principal',
          'nivel_poder',
          'imagen_url',
          'estado',
        ]),
      );
    });

    it('rechaza campos adicionales en héroes', async () => {
      const response = await request(app)
        .post('/api/heroes')
        .set(authorize(adminToken))
        .send({ ...validHeroBody, id: randomUUID() })
        .expect(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rechaza nombres duplicados sin distinguir mayúsculas', async () => {
      const response = await request(app)
        .post('/api/heroes')
        .set(authorize(adminToken))
        .send({ ...validHeroBody, nombre: 'spider-man' })
        .expect(409);
      expect(response.body.error.code).toBe('HERO_NAME_ALREADY_EXISTS');
    });

    it('reemplaza todos los campos editables mediante PUT', async () => {
      const response = await request(app)
        .put(`/api/heroes/${batmanId}`)
        .set(authorize(adminToken))
        .send(validHeroBody)
        .expect(200);
      expect(response.body.data).toMatchObject({
        id: batmanId,
        nombre: 'Wonder Woman',
        nombre_real: 'Diana Prince',
      });
    });

    it('rechaza un PUT incompleto de héroe', async () => {
      const response = await request(app)
        .put(`/api/heroes/${batmanId}`)
        .set(authorize(adminToken))
        .send({ nombre: 'Batman actualizado' })
        .expect(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('retorna 404 al actualizar un héroe inexistente', async () => {
      await request(app)
        .put(`/api/heroes/${randomUUID()}`)
        .set(authorize(adminToken))
        .send(validHeroBody)
        .expect(404);
    });

    it('detecta un nombre duplicado al actualizar', async () => {
      const response = await request(app)
        .put(`/api/heroes/${batmanId}`)
        .set(authorize(adminToken))
        .send({ ...validHeroBody, nombre: 'SUPERMAN' })
        .expect(409);
      expect(response.body.error.code).toBe('HERO_NAME_ALREADY_EXISTS');
    });

    it('elimina un héroe sin misiones y devuelve 204', async () => {
      await request(app).delete(`/api/heroes/${batmanId}`).set(authorize(adminToken)).expect(204);
      expect(await domainRepository.heroExists(batmanId)).toBe(false);
    });

    it('retorna 404 al eliminar un héroe inexistente', async () => {
      await request(app)
        .delete(`/api/heroes/${randomUUID()}`)
        .set(authorize(adminToken))
        .expect(404);
    });

    it('impide eliminar un héroe con misiones asociadas', async () => {
      const response = await request(app)
        .delete(`/api/heroes/${spiderManId}`)
        .set(authorize(adminToken))
        .expect(409);
      expect(response.body.error.code).toBe('HERO_HAS_MISSIONS');
    });
  });

  describe('misiones', () => {
    it('lista por fecha descendente y título, incluyendo el resumen del héroe', async () => {
      const response = await request(app)
        .get('/api/misiones')
        .set(authorize(consultaToken))
        .expect(200);
      expect(response.body.meta.total).toBe(3);
      expect(response.body.data.map((mission: { titulo: string }) => mission.titulo)).toEqual([
        'Alpha',
        'Zulu',
        'Anterior',
      ]);
      expect(response.body.data[0].superheroe).toEqual({
        id: spiderManId,
        nombre: 'Spider-Man',
      });
    });

    it('obtiene una misión por UUID y serializa la fecha como YYYY-MM-DD', async () => {
      const response = await request(app)
        .get(`/api/misiones/${alphaMissionId}`)
        .set(authorize(consultaToken))
        .expect(200);
      expect(response.body.data).toMatchObject({
        id: alphaMissionId,
        fecha: '2026-09-10',
        nivel_peligro: 'ALTO',
        superheroe_id: spiderManId,
      });
    });

    it('rechaza un UUID de misión inválido', async () => {
      const response = await request(app)
        .get('/api/misiones/no-es-uuid')
        .set(authorize(consultaToken))
        .expect(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('retorna 404 cuando la misión no existe', async () => {
      await request(app)
        .get(`/api/misiones/${randomUUID()}`)
        .set(authorize(consultaToken))
        .expect(404);
    });

    it('crea una misión asociada a un héroe y devuelve 201', async () => {
      const response = await request(app)
        .post('/api/misiones')
        .set(authorize(adminToken))
        .send(validMissionBody())
        .expect(201);
      expect(response.body.data).toMatchObject({
        fecha: '2026-10-20',
        superheroe_id: spiderManId,
        superheroe: { id: spiderManId, nombre: 'Spider-Man' },
      });
    });

    it('valida campos, enums y UUID de una misión', async () => {
      const response = await request(app)
        .post('/api/misiones')
        .set(authorize(adminToken))
        .send({
          titulo: '',
          descripcion: '',
          ubicacion: '',
          fecha: '20-10-2026',
          nivel_peligro: 'EXTREMO',
          estado: 'CANCELADA',
          superheroe_id: 'no-es-uuid',
        })
        .expect(400);
      expect(response.body.error.details.map((detail: { field: string }) => detail.field)).toEqual(
        expect.arrayContaining([
          'titulo',
          'descripcion',
          'ubicacion',
          'fecha',
          'nivel_peligro',
          'estado',
          'superheroe_id',
        ]),
      );
    });

    it('rechaza fechas de calendario imposibles', async () => {
      const response = await request(app)
        .post('/api/misiones')
        .set(authorize(adminToken))
        .send({ ...validMissionBody(), fecha: '2026-02-30' })
        .expect(400);
      expect(response.body.error.details[0].field).toBe('fecha');
    });

    it('retorna 404 si el héroe asociado al crear no existe', async () => {
      const response = await request(app)
        .post('/api/misiones')
        .set(authorize(adminToken))
        .send(validMissionBody(randomUUID()))
        .expect(404);
      expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('reemplaza una misión completa y permite reasignar el héroe', async () => {
      const response = await request(app)
        .put(`/api/misiones/${alphaMissionId}`)
        .set(authorize(adminToken))
        .send(validMissionBody(batmanId))
        .expect(200);
      expect(response.body.data).toMatchObject({
        id: alphaMissionId,
        titulo: 'Defensa orbital',
        superheroe_id: batmanId,
        superheroe: { id: batmanId, nombre: 'Batman' },
      });
    });

    it('rechaza un PUT incompleto de misión', async () => {
      await request(app)
        .put(`/api/misiones/${alphaMissionId}`)
        .set(authorize(adminToken))
        .send({ titulo: 'Incompleta' })
        .expect(400);
    });

    it('retorna 404 al actualizar una misión inexistente', async () => {
      await request(app)
        .put(`/api/misiones/${randomUUID()}`)
        .set(authorize(adminToken))
        .send(validMissionBody())
        .expect(404);
    });

    it('retorna 404 al reasignar una misión a un héroe inexistente', async () => {
      await request(app)
        .put(`/api/misiones/${alphaMissionId}`)
        .set(authorize(adminToken))
        .send(validMissionBody(randomUUID()))
        .expect(404);
    });

    it('elimina una misión y devuelve 204', async () => {
      await request(app)
        .delete(`/api/misiones/${alphaMissionId}`)
        .set(authorize(adminToken))
        .expect(204);
      expect(await domainRepository.findMissionById(alphaMissionId)).toBeNull();
    });

    it('retorna 404 al eliminar una misión inexistente', async () => {
      await request(app)
        .delete(`/api/misiones/${randomUUID()}`)
        .set(authorize(adminToken))
        .expect(404);
    });
  });
});
