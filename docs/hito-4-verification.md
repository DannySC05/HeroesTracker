# Hito 4 - CRUD del backend

Estado: **completado y verificado**.

## Alcance implementado

- CRUD de héroes con búsqueda parcial por nombre y orden ascendente.
- CRUD de misiones con orden por fecha descendente y título ascendente.
- Respuestas JSON en `snake_case` y errores con el sobre estándar del contrato.
- Autenticación obligatoria en todas las rutas de dominio.
- Lectura para `CONSULTA`; creación, actualización y eliminación solo para `ADMIN`.
- Validación estricta de UUID, campos obligatorios, URL, nivel de poder, fecha y enums.
- Conflicto por nombre de héroe duplicado.
- Relación obligatoria entre misión y héroe.
- Conflicto al eliminar un héroe que conserva misiones.

## Pruebas automatizadas

Desde la raíz:

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

La suite contiene 39 pruebas HTTP: 6 de autenticación y 33 del dominio. El
repositorio en memoria implementa el mismo contrato que el repositorio Prisma,
por lo que la lógica HTTP se prueba sin modificar Supabase.

## Verificación realizada con Supabase

Con la API conectada mediante el Session pooler se comprobó:

1. Login del usuario `ADMIN` sembrado.
2. Creación, consulta, búsqueda y actualización de un héroe temporal.
3. Creación, consulta y actualización de una misión asociada.
4. Respuesta `409 HERO_HAS_MISSIONS` al intentar eliminar primero el héroe.
5. Eliminación de la misión y luego del héroe.
6. Limpieza completa de los registros temporales.

Las credenciales y las cadenas de conexión permanecen exclusivamente en los
archivos `.env`, ignorados por Git.
