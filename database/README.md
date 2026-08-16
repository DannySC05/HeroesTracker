# Base de datos

Este paquete contiene la migración SQL inicial, la comprobación de conexión y el
seed idempotente de Heroes Tracker para PostgreSQL en Supabase. No requiere ORM
ni generación de clientes.

## Configuración

Copiar `.env.example` como `.env` dentro de esta carpeta y sustituir los valores:

```text
DATABASE_URL  URL del pooler de sesión para el seed y la aplicación
```

La conexión recomendada para desarrollo local es el pooler de sesión de Supabase
en el puerto 5432. Las contraseñas con caracteres especiales deben codificarse
para URL.

## Comandos desde la raíz

```bash
pnpm db:check
pnpm db:seed
```

La primera vez, copiar el contenido de
`database/migrations/001_initial_schema.sql` en el SQL Editor de Supabase y
ejecutarlo. Después, `db:check` confirma que la conexión funciona y que existen
las cuatro tablas esperadas.

Si la base ya fue creada, ejecutar también
`database/migrations/002_optional_hero_image.sql`. Esta migración permite guardar
héroes originales sin imagen y mantener el placeholder en la interfaz.

Para habilitar la administración de cuentas, ejecutar después
`database/migrations/003_user_account_status.sql`. Agrega el estado activo sin
alterar los usuarios existentes.

El seed puede repetirse sin crear duplicados. Actualiza los dos usuarios de prueba,
los ocho héroes y las seis misiones identificados por claves estables.
