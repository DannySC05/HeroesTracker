# Postman

Colección ejecutable del Hito 5 para autenticación, autorización y CRUD de
HeroesTracker.

## Archivos importables

- `HeroesTracker.postman_collection.json`: colección completa.
- `HeroesTracker.local.postman_environment.json`: ambiente para localhost.
- `HeroesTracker.production.postman_environment.json`: plantilla sin secretos
  para el backend desplegado.

Los environments versionados contienen credenciales y tokens vacíos. No se debe
guardar ni exportar una copia con secretos reales dentro del repositorio.

## Uso desde Postman

1. Importar la colección y el environment local.
2. Seleccionar `HeroesTracker Local`.
3. Completar localmente `admin_email`, `admin_password`, `consulta_email` y
   `consulta_password` con los usuarios cargados por el seed.
4. Iniciar el backend con `pnpm dev:backend`.
5. Abrir el Collection Runner y ejecutar únicamente la carpeta
   `Flujo automatizado`.

El flujo guarda automáticamente los JWT y los UUID temporales. Al final revoca
los tokens y elimina primero la misión y luego el héroe creado durante la prueba.

La carpeta `Ejemplos manuales` contiene `register` y el caso de credenciales
inválidas. El registro no forma parte del flujo automático porque la API no
incluye eliminación de usuarios y cada ejecución dejaría una cuenta nueva.

## Uso desde terminal

Con `backend/.env` y `database/.env` configurados:

```bash
pnpm postman:validate
pnpm postman:test
```

`postman:test`:

- compila el backend;
- lee en memoria las credenciales del seed desde `database/.env`;
- inicia la API si el puerto local todavía no está activo;
- ejecuta solo `Flujo automatizado` con Newman;
- detiene el servidor que haya iniciado.

Las contraseñas no se copian a la colección, al environment versionado ni a los
argumentos de la línea de comandos.

## Mantenimiento

La colección y los environments se generan de forma determinista:

```bash
pnpm postman:generate
pnpm postman:validate
```

Los cambios se realizan en `build-collection.mjs`; `validate.mjs` comprueba los
endpoints obligatorios, el esquema 2.1, los tipos secretos y la ausencia de URLs o
tokens reales.
