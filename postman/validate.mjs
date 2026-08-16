import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('.', import.meta.url));
const collectionPath = `${directory}HeroesTracker.postman_collection.json`;
const environmentPaths = [
  `${directory}HeroesTracker.local.postman_environment.json`,
  `${directory}HeroesTracker.production.postman_environment.json`,
];

const collection = JSON.parse(await readFile(collectionPath, 'utf8'));
const environments = await Promise.all(
  environmentPaths.map(async (path) => JSON.parse(await readFile(path, 'utf8'))),
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function collectRequests(items, requests = []) {
  for (const item of items) {
    if (item.request) {
      requests.push(item);
    }

    if (item.item) {
      collectRequests(item.item, requests);
    }
  }

  return requests;
}

assert(
  collection.info.schema.endsWith('/v2.1.0/collection.json'),
  'La colección debe usar el esquema 2.1.',
);

const requests = collectRequests(collection.item);
const signatures = new Set(requests.map((item) => `${item.request.method} ${item.request.url}`));
const requiredSignatures = [
  'POST {{base_url}}/api/auth/register',
  'POST {{base_url}}/api/auth/login',
  'GET {{base_url}}/api/auth/me',
  'POST {{base_url}}/api/auth/logout',
  'GET {{base_url}}/api/heroes',
  'GET {{base_url}}/api/heroes/{{hero_id}}',
  'POST {{base_url}}/api/heroes',
  'PUT {{base_url}}/api/heroes/{{hero_id}}',
  'DELETE {{base_url}}/api/heroes/{{hero_id}}',
  'GET {{base_url}}/api/misiones',
  'GET {{base_url}}/api/misiones/{{mission_id}}',
  'POST {{base_url}}/api/misiones',
  'PUT {{base_url}}/api/misiones/{{mission_id}}',
  'DELETE {{base_url}}/api/misiones/{{mission_id}}',
];

for (const signature of requiredSignatures) {
  assert(signatures.has(signature), `Falta la solicitud ${signature}.`);
}

for (const environment of environments) {
  assert(environment._postman_variable_scope === 'environment', 'Environment inválido.');
  const values = new Map(environment.values.map((variable) => [variable.key, variable]));

  for (const key of [
    'admin_email',
    'admin_password',
    'consulta_email',
    'consulta_password',
    'admin_token',
    'consulta_token',
  ]) {
    assert(values.has(key), `Falta ${key} en ${environment.name}.`);
    assert(values.get(key).value === '', `${key} debe permanecer vacío en ${environment.name}.`);
  }

  for (const key of ['admin_password', 'consulta_password', 'admin_token', 'consulta_token']) {
    assert(values.get(key).type === 'secret', `${key} debe ser de tipo secret.`);
  }
}

const serializedArtifacts = JSON.stringify([collection, ...environments]);
assert(
  !serializedArtifacts.includes('pooler.supabase.com'),
  'Se detectó una URL real de Supabase.',
);
assert(!serializedArtifacts.includes('Bearer eyJ'), 'Se detectó un JWT real.');

console.log(
  `Postman válido: ${requests.length} solicitudes, ${environments.length} environments y 0 secretos.`,
);
