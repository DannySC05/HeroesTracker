# Contrato de la API REST

## Base y autenticación

- Prefijo local: `http://localhost:3000/api`.
- Producción: `${API_BASE_URL}/api`.
- Todas las rutas excepto `register` y `login` requieren:
  `Authorization: Bearer <jwt>`.
- `ADMIN` puede usar todos los métodos.
- `CONSULTA` solo puede usar `GET`, además de su propio `logout`.
- Content-Type de solicitudes con cuerpo: `application/json`.

## Formato de éxito

Un recurso individual:

```json
{
  "data": {
    "id": "uuid"
  }
}
```

Un listado:

```json
{
  "data": [],
  "meta": {
    "total": 0
  }
}
```

## Formato de error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no son válidos.",
    "details": [
      {
        "field": "nivel_poder",
        "message": "Debe estar entre 1 y 100."
      }
    ]
  }
}
```

`details` puede omitirse si no existen errores por campo. Códigos comunes:

| HTTP | Código                                                                  | Uso                                             |
| ---- | ----------------------------------------------------------------------- | ----------------------------------------------- |
| 400  | `VALIDATION_ERROR`                                                      | Entrada, parámetro o consulta inválida          |
| 401  | `AUTHENTICATION_REQUIRED`                                               | Token ausente, inválido, expirado o revocado    |
| 403  | `FORBIDDEN`                                                             | El rol no tiene permiso                         |
| 404  | `RESOURCE_NOT_FOUND`                                                    | Identificador inexistente                       |
| 409  | `EMAIL_ALREADY_EXISTS`, `HERO_NAME_ALREADY_EXISTS`, `HERO_HAS_MISSIONS` | Conflicto de integridad                         |
| 500  | `INTERNAL_ERROR`                                                        | Error no esperado sin filtrar detalles internos |

## Autenticación

### `POST /api/auth/register`

Acceso público. El rol se fuerza a `CONSULTA`.

```json
{
  "nombre": "Peter Parker",
  "email": "peter@example.com",
  "password": "Password123"
}
```

Respuesta `201`: usuario sin contraseña ni hash. Errores: `400` o `409`.

### `POST /api/auth/login`

Acceso público.

```json
{
  "email": "peter@example.com",
  "password": "Password123"
}
```

Respuesta `200`:

```json
{
  "data": {
    "token": "jwt",
    "expires_in": 7200,
    "usuario": {
      "id": "uuid",
      "nombre": "Peter Parker",
      "email": "peter@example.com",
      "rol": "CONSULTA"
    }
  }
}
```

Credenciales incorrectas retornan `401` con un mensaje genérico.

### `GET /api/auth/me`

Acceso autenticado. Respuesta `200` con el usuario actual, sin contraseña ni hash.

### `POST /api/auth/logout`

Acceso autenticado para ambos roles. Revoca el JWT enviado y responde `204`.
Repetir la operación con el mismo token devuelve `401` porque ya está revocado.

## Héroes

Representación de un héroe:

```json
{
  "id": "uuid",
  "nombre": "Spider-Man",
  "nombre_real": "Peter Parker",
  "poder_principal": "Sentido arácnido",
  "nivel_poder": 82,
  "imagen_url": "https://example.com/spider-man.jpg",
  "estado": "ACTIVO",
  "created_at": "2026-08-15T20:00:00.000Z",
  "updated_at": "2026-08-15T20:00:00.000Z"
}
```

| Método y ruta             | Acceso              | Entrada                    | Éxito                    |
| ------------------------- | ------------------- | -------------------------- | ------------------------ |
| `GET /api/heroes`         | `ADMIN`, `CONSULTA` | Query opcional `nombre`    | `200`, listado y total   |
| `GET /api/heroes/{id}`    | `ADMIN`, `CONSULTA` | UUID en ruta               | `200`, héroe             |
| `POST /api/heroes`        | `ADMIN`             | Todos los campos editables | `201`, héroe creado      |
| `PUT /api/heroes/{id}`    | `ADMIN`             | Todos los campos editables | `200`, héroe actualizado |
| `DELETE /api/heroes/{id}` | `ADMIN`             | UUID en ruta               | `204`                    |

Campos editables obligatorios en `POST` y `PUT`: `nombre`, `nombre_real`,
`poder_principal`, `nivel_poder`, `imagen_url` y `estado`.

Reglas adicionales:

- La búsqueda `nombre` es parcial y no distingue mayúsculas.
- El listado se ordena por `nombre` ascendente.
- `nivel_poder` debe ser un número entero entre 1 y 100.
- `estado` solo acepta `ACTIVO` o `INACTIVO`.
- Nombre duplicado retorna `409`.
- Un héroe inexistente retorna `404`.
- Eliminar un héroe con misiones asociadas retorna `409 HERO_HAS_MISSIONS`.

## Misiones

Representación de una misión:

```json
{
  "id": "uuid",
  "titulo": "Defensa de Nueva York",
  "descripcion": "Proteger la ciudad de una amenaza externa.",
  "ubicacion": "Nueva York",
  "fecha": "2026-08-20",
  "nivel_peligro": "ALTO",
  "estado": "PENDIENTE",
  "superheroe_id": "uuid",
  "superheroe": {
    "id": "uuid",
    "nombre": "Spider-Man"
  },
  "created_at": "2026-08-15T20:00:00.000Z",
  "updated_at": "2026-08-15T20:00:00.000Z"
}
```

| Método y ruta               | Acceso              | Entrada                     | Éxito                     |
| --------------------------- | ------------------- | --------------------------- | ------------------------- |
| `GET /api/misiones`         | `ADMIN`, `CONSULTA` | Sin parámetros obligatorios | `200`, listado y total    |
| `GET /api/misiones/{id}`    | `ADMIN`, `CONSULTA` | UUID en ruta                | `200`, misión             |
| `POST /api/misiones`        | `ADMIN`             | Todos los campos editables  | `201`, misión creada      |
| `PUT /api/misiones/{id}`    | `ADMIN`             | Todos los campos editables  | `200`, misión actualizada |
| `DELETE /api/misiones/{id}` | `ADMIN`             | UUID en ruta                | `204`                     |

Campos editables obligatorios en `POST` y `PUT`: `titulo`, `descripcion`,
`ubicacion`, `fecha`, `nivel_peligro`, `estado` y `superheroe_id`.

Reglas adicionales:

- El listado se ordena por `fecha` descendente y luego por `titulo`.
- `fecha` debe ser una fecha válida en formato `YYYY-MM-DD`.
- `nivel_peligro` solo acepta `BAJO`, `MEDIO` o `ALTO`.
- `estado` solo acepta `PENDIENTE`, `EN_PROGRESO` o `COMPLETADA`.
- La misión y el héroe asociado inexistentes retornan `404`.

## Semántica de `PUT`

`PUT` reemplaza todos los campos editables del recurso. Si falta alguno, la API
responde `400`. Los identificadores y timestamps son administrados por el servidor.

## Política de autorización comprobable

| Operación                    | Sin token | `CONSULTA` |   `ADMIN` |
| ---------------------------- | --------: | ---------: | --------: |
| Register / Login             | Permitido |  Permitido | Permitido |
| Me / Logout                  |     `401` |  Permitido | Permitido |
| GET héroes y misiones        |     `401` |  Permitido | Permitido |
| POST, PUT, DELETE de dominio |     `401` |      `403` | Permitido |
