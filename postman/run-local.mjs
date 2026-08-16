import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import newman from 'newman';

const postmanDirectory = fileURLToPath(new URL('.', import.meta.url));
const rootDirectory = fileURLToPath(new URL('..', import.meta.url));

function parseEnv(contents) {
  const values = new Map();

  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);

    if (!match) {
      continue;
    }

    let value = match[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values.set(match[1], value);
  }

  return values;
}

function requireValue(values, key) {
  const value = values.get(key);

  if (!value) {
    throw new Error(`Falta ${key} en database/.env.`);
  }

  return value;
}

async function isApiReady() {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForApi(server) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error('El backend terminó antes de estar disponible.');
    }

    if (await isApiReady()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error('El backend no respondió en 20 segundos.');
}

async function runCollection(collection, environment) {
  await new Promise((resolve, reject) => {
    newman.run(
      {
        collection,
        environment,
        folder: 'Flujo automatizado',
        reporters: 'cli',
        timeoutRequest: 15000,
      },
      (error, summary) => {
        if (error) {
          reject(error);
          return;
        }

        if (summary.run.failures.length > 0) {
          reject(new Error(`La colección terminó con ${summary.run.failures.length} fallos.`));
          return;
        }

        resolve();
      },
    );
  });
}

const databaseEnv = parseEnv(
  await readFile(fileURLToPath(new URL('../database/.env', import.meta.url)), 'utf8'),
);
const collection = JSON.parse(
  await readFile(`${postmanDirectory}HeroesTracker.postman_collection.json`, 'utf8'),
);
const environment = JSON.parse(
  await readFile(`${postmanDirectory}HeroesTracker.local.postman_environment.json`, 'utf8'),
);

const overrides = {
  admin_email: requireValue(databaseEnv, 'SEED_ADMIN_EMAIL'),
  admin_password: requireValue(databaseEnv, 'SEED_ADMIN_PASSWORD'),
  consulta_email: requireValue(databaseEnv, 'SEED_CONSULTA_EMAIL'),
  consulta_password: requireValue(databaseEnv, 'SEED_CONSULTA_PASSWORD'),
};

for (const variable of environment.values) {
  if (Object.hasOwn(overrides, variable.key)) {
    variable.value = overrides[variable.key];
  }
}

let server;

try {
  if (!(await isApiReady())) {
    server = spawn(process.execPath, ['dist/server.js'], {
      cwd: `${rootDirectory}backend`,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    server.stdout.on('data', (chunk) => process.stdout.write(chunk));
    server.stderr.on('data', (chunk) => process.stderr.write(chunk));
    await waitForApi(server);
  }

  await runCollection(collection, environment);
  console.log('Colección Postman completada sin fallos y con limpieza de datos temporales.');
} finally {
  if (server && server.exitCode === null) {
    server.kill('SIGTERM');
  }
}
