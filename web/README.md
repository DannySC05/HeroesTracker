# Web

Aplicación React de Heroes Tracker. El Hito 6 incorpora autenticación real,
navegación protegida y la base visual del centro de operaciones.

## Preparación

1. Copiar `web/.env.example` como `web/.env`.
2. Mantener la API local en `http://localhost:3000/api` o actualizar
   `VITE_API_URL`.
3. Iniciar backend y web desde la raíz:

```bash
pnpm dev:backend
pnpm dev:web
```

Abrir `http://localhost:5173`. El origen debe coincidir con `CORS_ORIGINS` del
backend.

## Funcionalidad del Hito 6

- Login contra `POST /api/auth/login`.
- JWT persistido localmente y agregado por Axios a solicitudes protegidas.
- Restauración de sesión mediante `GET /api/auth/me`.
- Descarte automático de tokens inválidos o expirados.
- Logout real mediante `POST /api/auth/logout`.
- Redirección de rutas públicas y privadas según la sesión.
- Dashboard adaptado a los roles `ADMIN` y `CONSULTA`.
- Navegación responsive para escritorio y móvil.
- Estados de carga, error de credenciales y API no disponible.

## Funcionalidad del Hito 7

- Listado, búsqueda y detalle de héroes desde la API.
- CRUD de héroes disponible únicamente para `ADMIN`.
- Listado, filtros y detalle de misiones con su héroe asignado.
- CRUD de misiones y selector de héroes para `ADMIN`.
- Modo de solo lectura para `CONSULTA`.
- Estados explícitos de carga, error, ausencia de datos y confirmación.
- Formularios responsive con validación nativa y errores de la API.

## Verificación

```bash
pnpm --filter @heroes-tracker/web test
pnpm --filter @heroes-tracker/web lint
pnpm --filter @heroes-tracker/web typecheck
pnpm --filter @heroes-tracker/web build
```

Las pruebas cubren rutas privadas, login correcto e incorrecto, persistencia,
restauración, rechazo de tokens y logout.
