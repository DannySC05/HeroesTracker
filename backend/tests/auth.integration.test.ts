import { randomUUID } from 'node:crypto';

import { hash } from 'bcryptjs';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { authenticate, requireRoles } from '../src/modules/auth/auth.middleware.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import type { AuthConfig } from '../src/modules/auth/auth.types.js';
import { errorHandler } from '../src/shared/http/error-handler.js';
import { InMemoryAuthRepository } from './support/in-memory-auth.repository.js';

const authConfig: AuthConfig = {
  bcryptRounds: 4,
  jwtExpiresInSeconds: 7200,
  jwtSecret: 'test-secret-with-at-least-thirty-two-characters-long',
};

const validRegistration = {
  nombre: 'Peter Parker',
  email: 'peter@example.com',
  password: 'Password123',
};

describe('API de autenticación', () => {
  let repository: InMemoryAuthRepository;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    repository = new InMemoryAuthRepository();
    app = createApp({ authConfig, authRepository: repository });
  });

  async function registerAndLogin() {
    await request(app).post('/api/auth/register').send(validRegistration).expect(201);
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: validRegistration.email, password: validRegistration.password })
      .expect(200);

    return loginResponse.body.data.token as string;
  }

  it('registra un usuario CONSULTA, normaliza el email y nunca expone el hash', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegistration, email: '  PETER@EXAMPLE.COM  ' })
      .expect(201);

    expect(response.body).toEqual({
      data: {
        id: expect.any(String),
        nombre: validRegistration.nombre,
        email: validRegistration.email,
        rol: 'CONSULTA',
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('password');

    const storedUser = await repository.findUserByEmail(validRegistration.email);
    expect(storedUser?.passwordHash).not.toBe(validRegistration.password);
    expect(storedUser?.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('rechaza campos no permitidos, datos inválidos y emails duplicados', async () => {
    const roleResponse = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegistration, rol: 'ADMIN' })
      .expect(400);
    expect(roleResponse.body.error.code).toBe('VALIDATION_ERROR');

    const validationResponse = await request(app)
      .post('/api/auth/register')
      .send({ nombre: '', email: 'no-es-email', password: 'corta' })
      .expect(400);
    expect(validationResponse.body.error.details).toHaveLength(3);

    await request(app).post('/api/auth/register').send(validRegistration).expect(201);
    const duplicateResponse = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegistration, email: 'PETER@example.com' })
      .expect(409);
    expect(duplicateResponse.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('rechaza credenciales incorrectas y entrega un JWT con expiración al iniciar sesión', async () => {
    await request(app).post('/api/auth/register').send(validRegistration).expect(201);

    const invalidResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: validRegistration.email, password: 'PasswordIncorrecto' })
      .expect(401);
    expect(invalidResponse.body.error.code).toBe('INVALID_CREDENTIALS');

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: validRegistration.email, password: validRegistration.password })
      .expect(200);

    expect(response.body.data.token).toEqual(expect.any(String));
    expect(response.body.data.expires_in).toBe(7200);
    expect(response.body.data.usuario.rol).toBe('CONSULTA');
  });

  it('protege /me y devuelve el usuario del token válido', async () => {
    await request(app).get('/api/auth/me').expect(401);
    await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token-invalido')
      .expect(401);

    const token = await registerAndLogin();
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data).toMatchObject({
      nombre: validRegistration.nombre,
      email: validRegistration.email,
      rol: 'CONSULTA',
    });
  });

  it('revoca el JWT en logout e impide reutilizarlo', async () => {
    const token = await registerAndLogin();

    await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`).expect(204);
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
    await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`).expect(401);
  });

  it('responde 403 a CONSULTA y permite el acceso a ADMIN', async () => {
    const consultaToken = await registerAndLogin();
    const adminPassword = 'AdminPassword123';
    repository.seedUser({
      id: randomUUID(),
      nombre: 'Administrador',
      email: 'admin@example.com',
      passwordHash: await hash(adminPassword, authConfig.bcryptRounds),
      rol: 'ADMIN',
    });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: adminPassword })
      .expect(200);
    const adminToken = adminLogin.body.data.token as string;

    const authService = new AuthService(repository, authConfig);
    const protectedApp = express();
    protectedApp.get(
      '/admin',
      authenticate(authService),
      requireRoles('ADMIN'),
      (_request, response) => {
        response.status(200).json({ data: { allowed: true } });
      },
    );
    protectedApp.use(errorHandler);

    const forbiddenResponse = await request(protectedApp)
      .get('/admin')
      .set('Authorization', `Bearer ${consultaToken}`)
      .expect(403);
    expect(forbiddenResponse.body.error.code).toBe('FORBIDDEN');

    await request(protectedApp)
      .get('/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200, { data: { allowed: true } });
  });
});
