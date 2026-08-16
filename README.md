# Heroes Tracker

Monorepo para una plataforma de gestión de superhéroes y misiones compuesta por
una API REST, una aplicación web y una aplicación móvil.

## Estado

- Hito 0: contrato técnico completado.
- Hito 1: estructura y herramientas del monorepo completadas.
- Hito 2: esquema, migración y datos iniciales de PostgreSQL completados.
- Hito 3: autenticación JWT y autorización por roles completadas.
- Hito 4: CRUD protegido de héroes y misiones completado y verificado con Supabase.
- Hito 5: colección Postman automatizada completada y verificada con Supabase.
- Hito 6: autenticación, rutas protegidas y base visual web completadas.
- Hito 7: listado, detalle y CRUD web de héroes y misiones completados.
- Hito 8: aplicación móvil Expo con sesión, navegación, héroes, misiones,
  favoritos y operaciones por roles completada.

## Estructura

```text
├── backend/    API REST con Express y TypeScript
├── web/        aplicación React con Vite
├── mobile/     aplicación React Native con Expo
├── database/   esquema, migraciones y datos iniciales de PostgreSQL
├── postman/    colección de pruebas (Hito 5)
└── docs/       contratos y decisiones técnicas
```

## Requisitos locales

- Node.js 22.13 o superior.
- pnpm 10 o superior; el lockfile se generó con pnpm 11.19.

La aplicación móvil usa Expo SDK 54 y React Native 0.81, la combinación compatible
con la versión pública actual de Expo Go para iPhone. El archivo `.nvmrc` fija
Node.js 22 LTS, que también se usa para Android y el resto del monorepo.

## Instalación

```bash
pnpm install
```

Copiar el archivo de entorno correspondiente antes de implementar los servicios:

```text
backend/.env.example -> backend/.env
database/.env.example -> database/.env
web/.env.example     -> web/.env
mobile/.env.example  -> mobile/.env
```

Los valores incluidos son ejemplos y no deben reutilizarse en producción.

## Comandos principales

```bash
pnpm dev:backend  # API en http://localhost:3000
pnpm dev:web      # Vite en http://localhost:5173
pnpm dev:mobile   # servidor de Expo
pnpm db:check     # comprueba la conexión y las tablas en Supabase
pnpm db:seed      # carga datos iniciales sin duplicarlos
pnpm postman:validate # valida colección y ausencia de secretos
pnpm postman:test # ejecuta el flujo Postman contra la API local
pnpm test         # ejecuta las pruebas automatizadas
pnpm lint
pnpm typecheck
pnpm build
pnpm format:check
```

`pnpm dev` inicia en paralelo todos los paquetes que exponen un script `dev`.

## Verificación disponible

El backend expone `GET /api/health`, autenticación JWT y el CRUD completo bajo
`/api/heroes` y `/api/misiones`. Las pruebas HTTP cubren los permisos de ambos
roles, validaciones, conflictos y relaciones definidas en
[el contrato de la API](./docs/api-contract.md).

La evidencia y el procedimiento de comprobación del backend están en
[la verificación del Hito 4](./docs/hito-4-verification.md). La colección y sus
instrucciones se encuentran en [postman/](./postman/README.md).

## Despliegue web

La API se despliega en Render mediante `render.yaml` y la aplicación Vite en
Vercel usando `web/vercel.json`.

La aplicación móvil utiliza Expo y está preparada para EAS Build mediante
`mobile/eas.json`. Sus instrucciones están en `mobile/README.md`.

### Render

Crear un Blueprint desde este repositorio. Render solicitará `DATABASE_URL` y
`CORS_ORIGINS`; `JWT_SECRET` se genera automáticamente. La comprobación de salud
es `GET /api/health`.

Para `DATABASE_URL`, usar la conexión Session Pooler de Supabase en el puerto 5432. No copiar archivos `.env` al servicio.

### Vercel

Importar el mismo repositorio con `web` como Root Directory y definir:

```text
VITE_API_URL=https://heroes-tracker-api.onrender.com/api
```

Después de conocer la URL final de Vercel, actualizar `CORS_ORIGINS` en Render
con el origen exacto, por ejemplo `https://heroes-tracker.vercel.app`, y volver a
desplegar la API.
