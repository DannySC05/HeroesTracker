# Matriz de trazabilidad

Esta tabla separa los requisitos de la evaluación de las decisiones añadidas para
implementarlos dentro de la arquitectura acordada.

| Requisito de la evaluación                         | Decisión del proyecto                                | Hito de implementación |
| -------------------------------------------------- | ---------------------------------------------------- | ---------------------: |
| API REST centralizada                              | Express + TypeScript bajo `/api`                     |                    3-4 |
| JWT; solo register/login públicos                  | Middleware JWT y revocación por `jti`                |                      3 |
| Roles `ADMIN` y `CONSULTA`                         | Matriz de permisos; escrituras de dominio solo ADMIN |                      3 |
| Entidades usuario, héroe y misión                  | PostgreSQL + Prisma, UUID y constraints              |                      2 |
| Email y héroe únicos                               | Índices únicos sin distinguir mayúsculas             |                    2-4 |
| Poder entre 1 y 100                                | `CHECK` en BD y validación Zod                       |                    2-4 |
| Misión asociada a héroe existente                  | FK obligatoria y validación de servicio              |                    2-4 |
| Fecha y enums obligatorios                         | DATE y enums PostgreSQL/Zod                          |                    2-4 |
| Identificadores inexistentes = 404                 | Error `RESOURCE_NOT_FOUND`                           |                    3-4 |
| Errores JSON comprensibles                         | Sobre estándar `error`                               |                    3-4 |
| 2 usuarios, 8 héroes y 6 misiones                  | Seed idempotente                                     |                      2 |
| Web React con login y rutas protegidas             | React + Vite + React Router                          |                      6 |
| Listado, búsqueda, detalle y CRUD web              | Axios, formularios controlados y permisos            |                      7 |
| Carga, error y ausencia de datos web               | Estados explícitos por pantalla                      |                    6-7 |
| Mobile con login e inicio                          | Expo + React Navigation                              |                      8 |
| JWT y favoritos persistentes                       | AsyncStorage                                         |                      8 |
| Listados móviles con `FlatList`                    | Pantallas de héroes y misiones desde la API          |                      8 |
| Postman para autenticación y CRUD                  | Colección con scripts y environments                 |                      5 |
| Código integrado y sin datos principales estáticos | Web/mobile consumen únicamente la API                |                    6-9 |
| Código organizado y sin duplicación innecesaria    | Capas por responsabilidad y utilidades locales       |                    1-9 |
| README de instalación y ejecución                  | README raíz, variables y comandos                    |                     10 |
| Despliegue solicitado por el usuario               | Supabase, Render, Vercel y EAS                       |                     10 |

## Alcance fuera del documento, añadido por decisión técnica

- Tabla técnica de tokens revocados para que logout invalide realmente el JWT.
- Timestamps de auditoría básicos en las entidades.
- Restricción de borrado de héroes con misiones (`409`).
- Búsqueda por query `nombre` y orden determinista de listados.
- TypeScript, pnpm, Prisma, Zod y Axios como elecciones de implementación.

Estas extensiones no sustituyen ni reducen los requisitos de la evaluación.
