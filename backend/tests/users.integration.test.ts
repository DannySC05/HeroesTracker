import { randomUUID } from 'node:crypto';

import { hash } from 'bcryptjs';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import type { AuthConfig } from '../src/modules/auth/auth.types.js';
import { InMemoryAuthRepository } from './support/in-memory-auth.repository.js';

const authConfig: AuthConfig = {
  bcryptRounds: 4,
  jwtExpiresInSeconds: 7200,
  jwtSecret: 'test-secret-with-at-least-thirty-two-characters-long',
};

describe('Administración de usuarios CONSULTA', () => {
  let repository: InMemoryAuthRepository;
  let app: ReturnType<typeof createApp>;
  let adminToken: string;

  beforeEach(async () => {
    repository = new InMemoryAuthRepository();
    repository.seedUser({
      id: randomUUID(),
      nombre: 'Administrador',
      email: 'admin@example.com',
      passwordHash: await hash('AdminPassword123', authConfig.bcryptRounds),
      rol: 'ADMIN',
      activo: true,
    });
    app = createApp({ authConfig, authRepository: repository });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'AdminPassword123' })
      .expect(200);
    adminToken = login.body.data.token as string;
  });

  it('mantiene el registro público del contrato y reserva el módulo para ADMIN', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Agente', email: 'agente@example.com', password: 'Password123' })
      .expect(201);
    await request(app).get('/api/usuarios').expect(401);

    const created = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Agente Dos', email: 'agente2@example.com', password: 'Password123' })
      .expect(201);
    const consultaLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'agente@example.com', password: 'Password123' })
      .expect(200);

    await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${consultaLogin.body.data.token as string}`)
      .expect(403);
    expect(created.body.data).toMatchObject({ rol: 'CONSULTA', activo: true });
    expect(JSON.stringify(created.body)).not.toContain('password');
  });

  it('crea, lista y rechaza emails duplicados', async () => {
    await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Agente Uno', email: 'AGENTE@example.com', password: 'Password123' })
      .expect(201);

    const list = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(list.body.meta.total).toBe(1);
    expect(list.body.data[0]).toMatchObject({
      nombre: 'Agente Uno',
      email: 'agente@example.com',
      rol: 'CONSULTA',
      activo: true,
    });

    const duplicate = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Duplicado', email: 'agente@example.com', password: 'Password456' })
      .expect(409);
    expect(duplicate.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('edita datos, restablece la contraseña y desactiva sesiones existentes', async () => {
    const created = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Agente', email: 'agente@example.com', password: 'Password123' })
      .expect(201);
    const id = created.body.data.id as string;
    const consultaLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'agente@example.com', password: 'Password123' })
      .expect(200);
    const consultaToken = consultaLogin.body.data.token as string;

    await request(app)
      .put(`/api/usuarios/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Agente Actualizado',
        email: 'nuevo@example.com',
        password: 'NewPassword123',
        activo: true,
      })
      .expect(200);
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'agente@example.com', password: 'Password123' })
      .expect(401);
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'nuevo@example.com', password: 'NewPassword123' })
      .expect(200);

    await request(app)
      .put(`/api/usuarios/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Agente Actualizado', email: 'nuevo@example.com', activo: false })
      .expect(200);
    await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${consultaToken}`)
      .expect(401);
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'nuevo@example.com', password: 'NewPassword123' })
      .expect(401);
  });
});
