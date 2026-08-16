# Modelo de datos

## Diagrama lógico

```text
usuarios
  id (PK)
  nombre
  email (UNIQUE)
  password_hash
  rol

heroes                         misiones
  id (PK) <------------------- superheroe_id (FK)
  nombre (UNIQUE)                id (PK)
  nombre_real                    titulo
  poder_principal                descripcion
  nivel_poder                    ubicacion
  imagen_url                     fecha
  estado                         nivel_peligro
                                 estado

tokens_revocados
  jti (PK)
  usuario_id (FK -> usuarios.id)
  expira_en
```

## Tabla `usuarios`

| Campo           | Tipo          | Reglas                                                     |
| --------------- | ------------- | ---------------------------------------------------------- |
| `id`            | UUID          | PK, generado por la aplicación                             |
| `nombre`        | VARCHAR(100)  | Obligatorio, texto no vacío                                |
| `email`         | VARCHAR(254)  | Obligatorio, único, normalizado a minúsculas               |
| `password_hash` | VARCHAR(255)  | Obligatorio; nunca se guarda o retorna la contraseña plana |
| `rol`           | `rol_usuario` | `ADMIN` o `CONSULTA`; por defecto `CONSULTA`               |
| `activo`        | BOOLEAN       | Permite suspender acceso sin borrar la cuenta               |
| `created_at`    | TIMESTAMPTZ   | Generado automáticamente                                   |
| `updated_at`    | TIMESTAMPTZ   | Actualizado automáticamente                                |

## Tabla `heroes`

| Campo             | Tipo           | Reglas                                        |
| ----------------- | -------------- | --------------------------------------------- |
| `id`              | UUID           | PK                                            |
| `nombre`          | VARCHAR(100)   | Obligatorio y único sin distinguir mayúsculas |
| `nombre_real`     | VARCHAR(120)   | Obligatorio                                   |
| `poder_principal` | VARCHAR(160)   | Obligatorio                                   |
| `nivel_poder`     | SMALLINT       | Obligatorio, entre 1 y 100                    |
| `imagen_url`      | TEXT           | Obligatorio y con formato URL HTTP/HTTPS      |
| `estado`          | `estado_heroe` | `ACTIVO` o `INACTIVO`                         |
| `created_at`      | TIMESTAMPTZ    | Generado automáticamente                      |
| `updated_at`      | TIMESTAMPTZ    | Actualizado automáticamente                   |

## Tabla `misiones`

| Campo           | Tipo            | Reglas                                            |
| --------------- | --------------- | ------------------------------------------------- |
| `id`            | UUID            | PK                                                |
| `titulo`        | VARCHAR(160)    | Obligatorio                                       |
| `descripcion`   | TEXT            | Obligatorio                                       |
| `ubicacion`     | VARCHAR(160)    | Obligatorio                                       |
| `fecha`         | DATE            | Obligatoria, formato de API `YYYY-MM-DD`          |
| `nivel_peligro` | `nivel_peligro` | `BAJO`, `MEDIO` o `ALTO`                          |
| `estado`        | `estado_mision` | `PENDIENTE`, `EN_PROGRESO` o `COMPLETADA`         |
| `superheroe_id` | UUID            | FK obligatoria a `heroes.id`, borrado restringido |
| `created_at`    | TIMESTAMPTZ     | Generado automáticamente                          |
| `updated_at`    | TIMESTAMPTZ     | Actualizado automáticamente                       |

## Tabla técnica `tokens_revocados`

| Campo        | Tipo        | Reglas                                             |
| ------------ | ----------- | -------------------------------------------------- |
| `jti`        | UUID        | PK; identificador del JWT revocado                 |
| `usuario_id` | UUID        | FK obligatoria a `usuarios.id`, borrado en cascada |
| `expira_en`  | TIMESTAMPTZ | Permite limpiar registros cuando el JWT ya expiró  |
| `created_at` | TIMESTAMPTZ | Generado automáticamente                           |

## Integridad y normalización

- Los valores se recortan antes de validarse.
- Email y nombre de héroe se comparan sin distinguir mayúsculas.
- La base de datos refuerza las reglas críticas con índices, claves foráneas,
  enumeraciones y restricciones `CHECK`, además de la validación en la API.
- La FK de misiones usa `ON DELETE RESTRICT` y `ON UPDATE CASCADE`.
- Los índices mínimos cubren `usuarios.email`, `heroes.nombre`,
  `misiones.superheroe_id`, `misiones.fecha` y `tokens_revocados.expira_en`.

## Datos iniciales

El seed será idempotente e incluirá como mínimo:

- un usuario `ADMIN` y un usuario `CONSULTA`;
- ocho héroes inspirados en Marvel, con URL de imagen válida;
- seis misiones asociadas a héroes distintos.

Las credenciales de desarrollo se documentarán en el README y podrán cambiarse
por variables de entorno. No se reutilizarán como credenciales de producción.
