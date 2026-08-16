# Base de datos

Este paquete contiene el esquema Prisma, la migración SQL inicial y el seed
idempotente de Heroes Tracker para PostgreSQL en Supabase.

## Configuración

Copiar `.env.example` como `.env` dentro de esta carpeta y sustituir los valores:

```text
DATABASE_URL  URL del pooler de sesión para el seed y la aplicación
DIRECT_URL    conexión directa usada por Prisma Migrate
```

En entornos sin IPv6, `DIRECT_URL` puede usar el pooler de sesión de Supabase en
el puerto 5432. Las contraseñas con caracteres especiales deben codificarse para
URL.

## Comandos desde la raíz

```bash
pnpm db:validate
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
pnpm db:studio
```

`db:migrate:deploy` aplica migraciones ya versionadas y es el comando previsto
para Supabase. `db:migrate:dev` se reserva para una base PostgreSQL local o una
rama de desarrollo; nunca debe ejecutarse directamente contra producción.

El seed puede repetirse sin crear duplicados. Actualiza los dos usuarios de prueba,
los ocho héroes y las seis misiones identificados por claves estables.
