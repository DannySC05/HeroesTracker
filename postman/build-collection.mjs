import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { format } from 'prettier';

const postmanDirectory = fileURLToPath(new URL('.', import.meta.url));

const statusTest = (status) =>
  `pm.test("Responde ${status}", () => pm.response.to.have.status(${status}));`;
const errorCodeTest = (code) => [
  'const response = pm.response.json();',
  `pm.test("Código de error ${code}", () => pm.expect(response.error.code).to.eql("${code}"));`,
];

function scriptEvent(listen, lines) {
  return {
    listen,
    script: {
      type: 'text/javascript',
      exec: lines,
    },
  };
}

function apiRequest({
  name,
  method,
  path,
  auth = 'admin',
  body,
  tests = [],
  preRequest = [],
  description,
}) {
  const header = [];

  if (auth) {
    header.push({
      key: 'Authorization',
      value: `Bearer {{${auth}_token}}`,
      type: 'text',
    });
  }

  if (body) {
    header.push({ key: 'Content-Type', value: 'application/json', type: 'text' });
  }

  return {
    name,
    ...(description ? { description } : {}),
    event: [
      ...(preRequest.length ? [scriptEvent('prerequest', preRequest)] : []),
      ...(tests.length ? [scriptEvent('test', tests)] : []),
    ],
    request: {
      method,
      header,
      ...(body
        ? {
            body: {
              mode: 'raw',
              raw: JSON.stringify(body, null, 2),
              options: { raw: { language: 'json' } },
            },
          }
        : {}),
      url: `{{base_url}}${path}`,
      ...(description ? { description } : {}),
    },
  };
}

const heroBody = {
  nombre: 'Postman Hero {{run_suffix}}',
  nombre_real: 'Identidad Temporal',
  poder_principal: 'Pruebas automatizadas',
  nivel_poder: 50,
  imagen_url: 'https://example.com/postman-hero.jpg',
  estado: 'ACTIVO',
};

const updatedHeroBody = {
  ...heroBody,
  nombre: 'Postman Hero Updated {{run_suffix}}',
  nivel_poder: 51,
  estado: 'INACTIVO',
};

const missionBody = {
  titulo: 'Postman Mission {{run_suffix}}',
  descripcion: 'Misión temporal para verificar la API.',
  ubicacion: 'Entorno de pruebas',
  fecha: '2026-10-20',
  nivel_peligro: 'MEDIO',
  estado: 'PENDIENTE',
  superheroe_id: '{{hero_id}}',
};

const updatedMissionBody = {
  ...missionBody,
  titulo: 'Postman Mission Updated {{run_suffix}}',
  fecha: '2026-10-21',
  nivel_peligro: 'ALTO',
  estado: 'COMPLETADA',
};

const automatedItems = [
  {
    name: '01 - Preparación y autenticación',
    item: [
      apiRequest({
        name: 'Health',
        method: 'GET',
        path: '/api/health',
        auth: null,
        tests: [
          statusTest(200),
          'const response = pm.response.json();',
          'pm.test("Servicio saludable", () => pm.expect(response.data.status).to.eql("ok"));',
        ],
      }),
      apiRequest({
        name: 'Login ADMIN',
        method: 'POST',
        path: '/api/auth/login',
        auth: null,
        body: { email: '{{admin_email}}', password: '{{admin_password}}' },
        tests: [
          statusTest(200),
          'const response = pm.response.json();',
          'pm.test("Rol ADMIN", () => pm.expect(response.data.usuario.rol).to.eql("ADMIN"));',
          'pm.test("JWT recibido", () => pm.expect(response.data.token).to.be.a("string").and.not.empty);',
          'pm.environment.set("admin_token", response.data.token);',
        ],
      }),
      apiRequest({
        name: 'Login CONSULTA',
        method: 'POST',
        path: '/api/auth/login',
        auth: null,
        body: { email: '{{consulta_email}}', password: '{{consulta_password}}' },
        tests: [
          statusTest(200),
          'const response = pm.response.json();',
          'pm.test("Rol CONSULTA", () => pm.expect(response.data.usuario.rol).to.eql("CONSULTA"));',
          'pm.environment.set("consulta_token", response.data.token);',
        ],
      }),
      apiRequest({
        name: 'Me ADMIN',
        method: 'GET',
        path: '/api/auth/me',
        tests: [
          statusTest(200),
          'const response = pm.response.json();',
          'pm.test("Usuario autenticado", () => pm.expect(response.data.rol).to.eql("ADMIN"));',
        ],
      }),
    ],
  },
  {
    name: '02 - Héroes',
    item: [
      apiRequest({
        name: 'Listar héroes como CONSULTA',
        method: 'GET',
        path: '/api/heroes',
        auth: 'consulta',
        tests: [
          statusTest(200),
          'const response = pm.response.json();',
          'pm.test("Listado con total", () => { pm.expect(response.data).to.be.an("array"); pm.expect(response.meta.total).to.eql(response.data.length); });',
        ],
      }),
      apiRequest({
        name: 'Crear héroe como ADMIN',
        method: 'POST',
        path: '/api/heroes',
        body: heroBody,
        preRequest: [
          'const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;',
          'pm.collectionVariables.set("run_suffix", suffix);',
          'pm.collectionVariables.unset("hero_id");',
          'pm.collectionVariables.unset("mission_id");',
        ],
        tests: [
          statusTest(201),
          'const response = pm.response.json();',
          'pm.test("Héroe creado", () => pm.expect(response.data.id).to.be.a("string").and.not.empty);',
          'pm.collectionVariables.set("hero_id", response.data.id);',
        ],
      }),
      apiRequest({
        name: 'Obtener héroe creado',
        method: 'GET',
        path: '/api/heroes/{{hero_id}}',
        tests: [
          statusTest(200),
          'const response = pm.response.json();',
          'pm.test("UUID coincide", () => pm.expect(response.data.id).to.eql(pm.collectionVariables.get("hero_id")));',
        ],
      }),
      apiRequest({
        name: 'Buscar héroe por nombre',
        method: 'GET',
        path: '/api/heroes?nombre={{run_suffix}}',
        auth: 'consulta',
        tests: [
          statusTest(200),
          'const response = pm.response.json();',
          'pm.test("Búsqueda encuentra el temporal", () => pm.expect(response.data.some((hero) => hero.id === pm.collectionVariables.get("hero_id"))).to.be.true);',
        ],
      }),
      apiRequest({
        name: 'Actualizar héroe como ADMIN',
        method: 'PUT',
        path: '/api/heroes/{{hero_id}}',
        body: updatedHeroBody,
        tests: [
          statusTest(200),
          'const response = pm.response.json();',
          'pm.test("Actualización persistida", () => { pm.expect(response.data.nivel_poder).to.eql(51); pm.expect(response.data.estado).to.eql("INACTIVO"); });',
        ],
      }),
      apiRequest({
        name: 'Nombre duplicado',
        method: 'POST',
        path: '/api/heroes',
        body: { ...updatedHeroBody, nombre: 'postman hero updated {{run_suffix}}' },
        tests: [statusTest(409), ...errorCodeTest('HERO_NAME_ALREADY_EXISTS')],
      }),
      apiRequest({
        name: 'CONSULTA no puede crear héroes',
        method: 'POST',
        path: '/api/heroes',
        auth: 'consulta',
        body: { ...heroBody, nombre: 'Forbidden {{run_suffix}}' },
        tests: [statusTest(403), ...errorCodeTest('FORBIDDEN')],
      }),
    ],
  },
  {
    name: '03 - Misiones',
    item: [
      apiRequest({
        name: 'Listar misiones como CONSULTA',
        method: 'GET',
        path: '/api/misiones',
        auth: 'consulta',
        tests: [
          statusTest(200),
          'const response = pm.response.json();',
          'pm.test("Listado con total", () => { pm.expect(response.data).to.be.an("array"); pm.expect(response.meta.total).to.eql(response.data.length); });',
        ],
      }),
      apiRequest({
        name: 'Crear misión como ADMIN',
        method: 'POST',
        path: '/api/misiones',
        body: missionBody,
        tests: [
          statusTest(201),
          'const response = pm.response.json();',
          'pm.test("Relación correcta", () => pm.expect(response.data.superheroe_id).to.eql(pm.collectionVariables.get("hero_id")));',
          'pm.collectionVariables.set("mission_id", response.data.id);',
        ],
      }),
      apiRequest({
        name: 'Obtener misión creada',
        method: 'GET',
        path: '/api/misiones/{{mission_id}}',
        tests: [
          statusTest(200),
          'const response = pm.response.json();',
          'pm.test("UUID coincide", () => pm.expect(response.data.id).to.eql(pm.collectionVariables.get("mission_id")));',
        ],
      }),
      apiRequest({
        name: 'Actualizar misión como ADMIN',
        method: 'PUT',
        path: '/api/misiones/{{mission_id}}',
        body: updatedMissionBody,
        tests: [
          statusTest(200),
          'const response = pm.response.json();',
          'pm.test("Actualización persistida", () => { pm.expect(response.data.fecha).to.eql("2026-10-21"); pm.expect(response.data.estado).to.eql("COMPLETADA"); });',
        ],
      }),
      apiRequest({
        name: 'CONSULTA no puede crear misiones',
        method: 'POST',
        path: '/api/misiones',
        auth: 'consulta',
        body: missionBody,
        tests: [statusTest(403), ...errorCodeTest('FORBIDDEN')],
      }),
      apiRequest({
        name: 'Misión con fecha inválida',
        method: 'POST',
        path: '/api/misiones',
        body: { ...missionBody, fecha: '2026-02-30' },
        tests: [statusTest(400), ...errorCodeTest('VALIDATION_ERROR')],
      }),
    ],
  },
  {
    name: '04 - Errores y reglas de negocio',
    item: [
      apiRequest({
        name: 'Héroe con misiones no se elimina',
        method: 'DELETE',
        path: '/api/heroes/{{hero_id}}',
        tests: [statusTest(409), ...errorCodeTest('HERO_HAS_MISSIONS')],
      }),
      apiRequest({
        name: 'Ruta protegida sin token',
        method: 'GET',
        path: '/api/heroes',
        auth: null,
        tests: [statusTest(401), ...errorCodeTest('AUTHENTICATION_REQUIRED')],
      }),
      apiRequest({
        name: 'UUID inválido',
        method: 'GET',
        path: '/api/heroes/no-es-uuid',
        tests: [statusTest(400), ...errorCodeTest('VALIDATION_ERROR')],
      }),
      apiRequest({
        name: 'Héroe inexistente',
        method: 'GET',
        path: '/api/heroes/00000000-0000-4000-8000-000000000000',
        tests: [statusTest(404), ...errorCodeTest('RESOURCE_NOT_FOUND')],
      }),
      apiRequest({
        name: 'Misión inexistente',
        method: 'GET',
        path: '/api/misiones/00000000-0000-4000-8000-000000000000',
        tests: [statusTest(404), ...errorCodeTest('RESOURCE_NOT_FOUND')],
      }),
    ],
  },
  {
    name: '05 - Limpieza y cierre',
    item: [
      apiRequest({
        name: 'Eliminar misión temporal',
        method: 'DELETE',
        path: '/api/misiones/{{mission_id}}',
        tests: [statusTest(204), 'pm.collectionVariables.unset("mission_id");'],
      }),
      apiRequest({
        name: 'Eliminar héroe temporal',
        method: 'DELETE',
        path: '/api/heroes/{{hero_id}}',
        tests: [statusTest(204)],
      }),
      apiRequest({
        name: 'Confirmar héroe eliminado',
        method: 'GET',
        path: '/api/heroes/{{hero_id}}',
        tests: [
          statusTest(404),
          ...errorCodeTest('RESOURCE_NOT_FOUND'),
          'pm.collectionVariables.unset("hero_id");',
          'pm.collectionVariables.unset("run_suffix");',
        ],
      }),
      apiRequest({
        name: 'Logout CONSULTA',
        method: 'POST',
        path: '/api/auth/logout',
        auth: 'consulta',
        tests: [statusTest(204)],
      }),
      apiRequest({
        name: 'Token CONSULTA revocado',
        method: 'GET',
        path: '/api/auth/me',
        auth: 'consulta',
        tests: [
          statusTest(401),
          ...errorCodeTest('AUTHENTICATION_REQUIRED'),
          'pm.environment.unset("consulta_token");',
        ],
      }),
      apiRequest({
        name: 'Logout ADMIN',
        method: 'POST',
        path: '/api/auth/logout',
        tests: [statusTest(204), 'pm.environment.unset("admin_token");'],
      }),
    ],
  },
];

const manualItems = [
  apiRequest({
    name: 'Registrar usuario CONSULTA',
    method: 'POST',
    path: '/api/auth/register',
    auth: null,
    body: {
      nombre: '{{manual_register_name}}',
      email: '{{manual_register_email}}',
      password: '{{manual_register_password}}',
    },
    tests: [
      statusTest(201),
      'const response = pm.response.json();',
      'pm.test("Siempre registra CONSULTA", () => pm.expect(response.data.rol).to.eql("CONSULTA"));',
      'pm.test("No expone contraseña", () => pm.expect(JSON.stringify(response)).not.to.include("password"));',
    ],
    description: 'Ejecutar manualmente con un email nuevo para verificar el registro público.',
  }),
  apiRequest({
    name: 'Listar usuarios CONSULTA como ADMIN',
    method: 'GET',
    path: '/api/usuarios',
    tests: [
      statusTest(200),
      'const response = pm.response.json();',
      'pm.test("Lista solo CONSULTA", () => response.data.forEach((user) => pm.expect(user.rol).to.eql("CONSULTA")));',
    ],
    description: 'Requiere ejecutar primero Login ADMIN.',
  }),
  apiRequest({
    name: 'Crear usuario CONSULTA como ADMIN',
    method: 'POST',
    path: '/api/usuarios',
    body: {
      nombre: '{{manual_register_name}}',
      email: '{{manual_register_email}}',
      password: '{{manual_register_password}}',
    },
    tests: [
      statusTest(201),
      'const response = pm.response.json();',
      'pm.test("Crea CONSULTA activo", () => { pm.expect(response.data.rol).to.eql("CONSULTA"); pm.expect(response.data.activo).to.eql(true); });',
      'pm.environment.set("managed_user_id", response.data.id);',
    ],
    description: 'Requiere Login ADMIN y un email nuevo.',
  }),
  apiRequest({
    name: 'Desactivar usuario CONSULTA como ADMIN',
    method: 'PUT',
    path: '/api/usuarios/{{managed_user_id}}',
    body: {
      nombre: '{{manual_register_name}}',
      email: '{{manual_register_email}}',
      activo: false,
    },
    tests: [
      statusTest(200),
      'const response = pm.response.json();',
      'pm.test("Cuenta desactivada", () => pm.expect(response.data.activo).to.eql(false));',
    ],
    description: 'Ejecutar después de crear el usuario administrado.',
  }),
  apiRequest({
    name: 'Login con credenciales inválidas',
    method: 'POST',
    path: '/api/auth/login',
    auth: null,
    body: { email: 'invalid@example.com', password: 'InvalidPassword123' },
    tests: [statusTest(401), ...errorCodeTest('INVALID_CREDENTIALS')],
  }),
  apiRequest({
    name: 'Buscar imágenes de Spider-Man',
    method: 'GET',
    path: '/api/hero-images?name=Spider-Man',
    tests: [
      statusTest(200),
      'const response = pm.response.json();',
      'pm.test("Devuelve candidatos de imagen", () => pm.expect(response.data).to.be.an("array"));',
    ],
    description:
      'Requiere ejecutar primero Login ADMIN y configurar COMICVINE_API_KEY en el backend.',
  }),
];

const collection = {
  info: {
    _postman_id: '7f42a75b-b97c-4b13-8cd4-b4d79eaef460',
    name: 'HeroesTracker API',
    description:
      'Colección del Hito 5. Ejecutar la carpeta “Flujo automatizado” para probar autenticación, permisos, CRUD, errores y limpieza.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [
    {
      name: 'Flujo automatizado',
      description:
        'Ejecutar esta carpeta con el Collection Runner. Requiere las credenciales de los usuarios ADMIN y CONSULTA sembrados.',
      item: automatedItems,
    },
    {
      name: 'Ejemplos manuales',
      description:
        'No se ejecutan en el comando automatizado. Incluye registro público y administración protegida de usuarios.',
      item: manualItems,
    },
  ],
  variable: [
    { key: 'run_suffix', value: '' },
    { key: 'hero_id', value: '' },
    { key: 'mission_id', value: '' },
    { key: 'managed_user_id', value: '' },
  ],
};

function environment({ id, name, baseUrl }) {
  return {
    id,
    name,
    values: [
      { key: 'base_url', value: baseUrl, enabled: true, type: 'default' },
      { key: 'admin_email', value: '', enabled: true, type: 'default' },
      { key: 'admin_password', value: '', enabled: true, type: 'secret' },
      { key: 'consulta_email', value: '', enabled: true, type: 'default' },
      { key: 'consulta_password', value: '', enabled: true, type: 'secret' },
      { key: 'admin_token', value: '', enabled: true, type: 'secret' },
      { key: 'consulta_token', value: '', enabled: true, type: 'secret' },
      { key: 'manual_register_name', value: 'Postman User', enabled: true, type: 'default' },
      { key: 'manual_register_email', value: '', enabled: true, type: 'default' },
      { key: 'manual_register_password', value: '', enabled: true, type: 'secret' },
    ],
    _postman_variable_scope: 'environment',
    _postman_exported_at: '2026-08-15T00:00:00.000Z',
    _postman_exported_using: 'HeroesTracker repository generator',
  };
}

const files = [
  ['HeroesTracker.postman_collection.json', collection],
  [
    'HeroesTracker.local.postman_environment.json',
    environment({
      id: 'bdcf7c03-24d2-4b6e-8f61-0bb4da86235e',
      name: 'HeroesTracker Local',
      baseUrl: 'http://localhost:3000',
    }),
  ],
  [
    'HeroesTracker.production.postman_environment.json',
    environment({
      id: '530a9741-694a-490f-b7d0-d25704e21cc4',
      name: 'HeroesTracker Production',
      baseUrl: 'https://your-backend.example.com',
    }),
  ],
];

await Promise.all(
  files.map(async ([filename, contents]) =>
    writeFile(
      `${postmanDirectory}${filename}`,
      await format(JSON.stringify(contents), { parser: 'json', printWidth: 100 }),
      'utf8',
    ),
  ),
);

console.log(`Generados ${files.length} artefactos Postman.`);
