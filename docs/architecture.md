# Arquitectura y decisiones

## Objetivo

Construir una solución integrada para gestionar superhéroes y misiones mediante
una única API REST consumida por una aplicación web y una aplicación móvil.

## Estructura objetivo del monorepo

```text
HeroesTracker/
├── web/                 # React + Vite + TypeScript; despliegue en Vercel
├── backend/             # Node.js + Express + TypeScript; Render o Railway
├── mobile/              # React Native + Expo + TypeScript; EAS Build
├── postman/             # Colección y environments sin secretos
├── database/            # Migraciones, esquema SQL y datos iniciales
├── docs/                # Contratos y decisiones del proyecto
├── .env.example
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Stack acordado

| Área           | Tecnología                      | Motivo                                                          |
| -------------- | ------------------------------- | --------------------------------------------------------------- |
| Monorepo       | pnpm workspaces                 | Scripts centralizados e instalaciones reproducibles             |
| Backend        | Node.js, Express y TypeScript   | API sencilla, explícita y fácil de explicar                     |
| Acceso a datos | Prisma ORM                      | Migraciones, restricciones tipadas y soporte PostgreSQL         |
| Validación     | Zod                             | Un único esquema para validar cuerpo, parámetros y consultas    |
| Seguridad      | bcrypt y JWT                    | Hash de contraseñas y autenticación requerida por la evaluación |
| Web            | React, Vite y TypeScript        | Cliente ligero con React Router                                 |
| Móvil          | React Native, Expo y TypeScript | Flujo compatible con Expo y EAS Build                           |
| HTTP           | Axios                           | Cliente uniforme para web y móvil                               |
| Base de datos  | PostgreSQL en Supabase          | Destino solicitado para persistencia                            |
| Pruebas API    | Postman                         | Entregable explícito de autenticación y CRUD                    |

## Límites de responsabilidad

- `backend` es la única capa que accede directamente a PostgreSQL.
- `web` y `mobile` consumen exclusivamente `/api/*`; no utilizan el SDK de
  Supabase ni contienen arreglos que reemplacen los datos principales.
- `database` conserva la historia de migraciones y el proceso de carga inicial.
- `postman` verifica el mismo contrato consumido por los clientes.
- Los secretos se configuran en variables de entorno y nunca se versionan.

## Flujo general

```text
Web (Vercel) -----------\
                        >--- API REST (Render/Railway) --- PostgreSQL (Supabase)
Mobile (Expo/EAS) ------/
                Postman / pruebas ---^
```

## Convenciones

- Código, variables y nombres de dominio en español cuando provienen del enunciado.
- Rutas exactamente bajo `/api`, usando `/heroes` y `/misiones` como se solicita.
- JSON en `snake_case` para coincidir con los campos del documento.
- Identificadores UUID y fechas en ISO 8601.
- Todas las respuestas son JSON salvo las respuestas exitosas con estado `204`.
- La API no depende del estado de memoria del proceso para datos persistentes.
- Versiones exactas de dependencias se fijarán en el Hito 1 mediante el lockfile.

## Decisiones sobre ambigüedades

1. `POST /api/auth/register` siempre crea usuarios con rol `CONSULTA`. El cliente
   no puede registrarse como `ADMIN`; el administrador inicial proviene del seed.
2. `POST /api/auth/logout` revoca el JWT actual mediante su identificador `jti`.
3. Eliminar un héroe con misiones asociadas devuelve `409 CONFLICT`. Primero deben
   reasignarse o eliminarse sus misiones para no perder información implícitamente.
4. La búsqueda se realiza con `GET /api/heroes?nombre=texto`.
5. Los listados no tendrán paginación en la primera versión porque el alcance es
   pequeño; el formato de respuesta permite añadirla más adelante.
6. Los favoritos son locales al dispositivo y se almacenan en AsyncStorage; no se
   agrega una entidad de favoritos al backend.
7. Se escogerá Render como destino inicial del backend. Railway queda como
   alternativa si las condiciones de despliegue impiden usar Render.
