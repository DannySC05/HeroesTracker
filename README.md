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
- Interfaces web/móvil: pendientes de sus hitos correspondientes.

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

Expo SDK 57 requiere Node.js 22.13 como mínimo. El archivo `.nvmrc` fija la línea
LTS recomendada para el proyecto.

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
pnpm db:validate  # valida el esquema Prisma
pnpm db:migrate:deploy # aplica migraciones versionadas
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
