# Seguridad, configuración y despliegue

## Contraseñas

- Se exige un mínimo de 8 caracteres.
- Se aplica hash con bcrypt y un costo configurable, nunca cifrado reversible.
- La API nunca registra ni retorna contraseñas o hashes.
- El login utiliza un mensaje genérico para no revelar si el email existe.

## JWT

- Algoritmo inicial: `HS256` con un secreto largo y exclusivo por entorno.
- Duración inicial: 2 horas (`7200` segundos).
- Claims mínimas: `sub` (usuario), `rol`, `jti`, `iat` y `exp`.
- La API valida firma, expiración, usuario existente y ausencia del `jti` en la
  tabla de tokens revocados.
- Logout registra el `jti` hasta su expiración. Una tarea de mantenimiento podrá
  eliminar registros expirados sin alterar el comportamiento funcional.
- Web guarda el token en `sessionStorage` para limitar su persistencia.
- Mobile lo guarda en AsyncStorage, tal como exige el documento.

## CORS y transporte

- Desarrollo admite solamente los orígenes locales documentados.
- Producción admite únicamente el dominio publicado de Vercel.
- Las aplicaciones desplegadas utilizan HTTPS.
- No se permiten orígenes globales con credenciales habilitadas.

## Variables raíz documentadas

El Hito 1 creará `.env.example` sin valores secretos. Variables previstas:

| Variable                 | Consumidor     | Propósito                                       |
| ------------------------ | -------------- | ----------------------------------------------- |
| `DATABASE_URL`           | Backend / seed | Pooler de sesión PostgreSQL para ejecución      |
| `DIRECT_URL`             | Prisma Migrate | Conexión directa para migraciones en Supabase   |
| `JWT_SECRET`             | Backend        | Firma y validación de JWT                       |
| `JWT_EXPIRES_IN`         | Backend        | Duración del token, valor inicial `2h`          |
| `BCRYPT_ROUNDS`          | Backend        | Costo del hash, valor local inicial `12`        |
| `PORT`                   | Backend        | Puerto HTTP, localmente `3000`                  |
| `NODE_ENV`               | Backend        | `development`, `test` o `production`            |
| `CORS_ORIGINS`           | Backend        | Lista separada por comas de orígenes permitidos |
| `VITE_API_URL`           | Web            | URL pública del backend, incluyendo `/api`      |
| `EXPO_PUBLIC_API_URL`    | Mobile         | URL alcanzable del backend, incluyendo `/api`   |
| `SEED_ADMIN_EMAIL`       | Seed           | Email del administrador inicial                 |
| `SEED_ADMIN_PASSWORD`    | Seed           | Contraseña inicial solo para carga controlada   |
| `SEED_CONSULTA_EMAIL`    | Seed           | Email del usuario de consulta                   |
| `SEED_CONSULTA_PASSWORD` | Seed           | Contraseña inicial solo para carga controlada   |

El backend debe fallar al iniciar si falta una variable obligatoria. Las variables
públicas de Vite y Expo nunca pueden contener secretos.

## Entornos

| Entorno    | Base de datos                                  | Backend         | Web                    | Mobile                       |
| ---------- | ---------------------------------------------- | --------------- | ---------------------- | ---------------------------- |
| Desarrollo | PostgreSQL local o rama de desarrollo Supabase | localhost:3000  | localhost de Vite      | Expo Go/emulador/dispositivo |
| Pruebas    | Base aislada                                   | Proceso de test | No aplica inicialmente | No aplica inicialmente       |
| Producción | Supabase                                       | Render          | Vercel                 | EAS Build                    |

En dispositivo físico, `localhost` no apunta a la computadora. El README deberá
explicar el uso de la IP local o de la URL desplegada para `EXPO_PUBLIC_API_URL`.

## Orden de despliegue

1. Crear el proyecto PostgreSQL en Supabase y guardar las URLs de conexión.
2. Ejecutar migraciones y seed controlado.
3. Desplegar el backend en Render y verificar `/api` mediante Postman.
4. Configurar CORS y desplegar `web` en Vercel.
5. Configurar la URL pública y generar el build móvil con EAS.
6. Ejecutar la colección de Postman contra producción.

## Configuración versionada de despliegue

- `render.yaml` crea la API como Web Service, valida `/api/health` y solicita los
  secretos sin almacenarlos en Git.
- `web/vercel.json` compila Vite y reescribe las rutas de la SPA a `index.html`.
- `DATABASE_URL` usa el Session Pooler de Supabase en el puerto 5432 para el
  servicio persistente de Render.
- `VITE_API_URL` termina en `/api` y `CORS_ORIGINS` contiene únicamente orígenes,
  sin rutas finales ni `/api`.

## Registro de errores

- En desarrollo pueden registrarse detalles técnicos sin incluir secretos.
- En producción se registra un identificador de solicitud y el error interno.
- El cliente recibe el contrato JSON público, no stack traces ni mensajes de la BD.

## Alcance de las pruebas posteriores

- Unitarias: validaciones y reglas de autorización.
- Integración: autenticación, revocación JWT, CRUD y restricciones de BD.
- Postman: flujos completos con ambos roles y códigos HTTP esperados.
- Clientes: carga, error, ausencia de datos y expiración de sesión.
