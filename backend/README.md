# Backend

API REST de Heroes Tracker construida con Express, TypeScript, PostgreSQL y JWT.

## Preparación

1. Copiar `backend/.env.example` como `backend/.env`.
2. Configurar `DATABASE_URL`, `JWT_SECRET` y las demás variables. Para habilitar
   la búsqueda automática de imágenes, añadir la clave de Comic Vine en
   `COMICVINE_API_KEY`. La clave permanece en el backend y no debe configurarse
   en Vercel ni exponerse al navegador.
3. Ejecutar `database/migrations/001_initial_schema.sql` una vez en el SQL Editor
   de Supabase y cargar los datos iniciales desde la raíz:

```bash
pnpm db:check
pnpm db:seed
```

4. Iniciar el backend:

```bash
pnpm dev:backend
```

## Endpoints disponibles

| Método | Ruta                 | Acceso                             |
| ------ | -------------------- | ---------------------------------- |
| POST   | `/api/auth/register` | Público; siempre crea `CONSULTA`   |
| POST   | `/api/auth/login`    | Público                            |
| GET    | `/api/auth/me`       | JWT válido                         |
| POST   | `/api/auth/logout`   | JWT válido; revoca el token actual |

El token se envía como `Authorization: Bearer <jwt>`. Las respuestas nunca
incluyen la contraseña ni su hash.

| Método             | Ruta                  | `CONSULTA` | `ADMIN` |
| ------------------ | --------------------- | ---------- | ------- |
| GET                | `/api/heroes`         | Sí         | Sí      |
| GET                | `/api/heroes/:id`     | Sí         | Sí      |
| POST, PUT y DELETE | `/api/heroes[/:id]`   | No (`403`) | Sí      |
| GET                | `/api/hero-images`    | No (`403`) | Sí      |
| GET                | `/api/misiones`       | Sí         | Sí      |
| GET                | `/api/misiones/:id`   | Sí         | Sí      |
| POST, PUT y DELETE | `/api/misiones[/:id]` | No (`403`) | Sí      |

Los listados devuelven `{ data, meta: { total } }`. La búsqueda de héroes acepta
`?nombre=texto`; es parcial y no distingue mayúsculas. `PUT` exige todos los
campos editables del recurso.

La búsqueda de imágenes acepta `?name=Spider-Man`, consulta únicamente personajes,
limita y almacena temporalmente los resultados, y nunca expone la clave de Comic
Vine al navegador. Comic Vine solo permite uso no comercial y requiere atribución.

## Cómo comprobarlo

```bash
pnpm --filter @heroes-tracker/backend test
```

Las pruebas HTTP verifican:

- registro, normalización del email y hash bcrypt;
- rechazo de campos no permitidos, datos inválidos y duplicados;
- login correcto e incorrecto;
- acceso protegido a `me`;
- revocación real y no reutilización del JWT;
- rechazo `403` para `CONSULTA` y acceso para `ADMIN`;
- CRUD completo de héroes y misiones;
- UUID, cuerpos estrictos, URL, poder, fecha y enumeraciones;
- búsqueda y ordenamiento de listados;
- nombres de héroe duplicados y recursos inexistentes;
- relación obligatoria misión-héroe;
- bloqueo `409` al eliminar héroes con misiones.

Estas pruebas usan un repositorio en memoria para aislar la lógica HTTP. El
repositorio de producción implementa el mismo contrato mediante consultas SQL
parametrizadas con `pg`. Con los
`.env` configurados, el mismo recorrido puede comprobarse contra Supabase como se
describe en `docs/hito-4-verification.md`.
