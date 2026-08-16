# Aplicación móvil - Hito 8

Aplicación React Native con Expo que consume la misma API REST de Heroes Tracker.

## Compatibilidad

- Expo SDK 54 y React Native 0.81.5.
- iPhone/iPad mediante la versión pública actual de Expo Go de App Store.
- Android mediante Expo Go de Google Play o un APK generado con EAS Build.
- Node.js 22 LTS (el repositorio incluye `.nvmrc`).

SDK 54 se mantiene intencionalmente para que el mismo proyecto abra tanto en la
aplicación pública de iOS como en Android. No actualizar Expo de forma aislada:
una versión mayor debe migrarse junto con React Native y Expo Go.

## Funcionalidades

- inicio de sesión JWT persistido con AsyncStorage y cierre de sesión;
- navegación protegida con Inicio, Héroes, Misiones, Favoritos y Usuarios;
- héroes y misiones obtenidos desde la API mediante `FlatList`;
- búsqueda y detalle de héroes, misiones activas e historial completado;
- favoritos persistentes por usuario mediante AsyncStorage;
- detalle y filtros de misiones;
- CRUD de héroes y misiones para `ADMIN` y consulta para `CONSULTA`;
- creación, edición, restablecimiento de contraseña y activación de usuarios
  `CONSULTA`, visible exclusivamente para `ADMIN`;
- búsqueda protegida de imágenes en Comic Vine desde el backend;
- estados de carga, error, vacío y actualización por gesto.

## Configuración

Copiar `.env.example` como `.env` y configurar la URL pública del backend:

```env
EXPO_PUBLIC_API_URL="https://heroes-tracker-api.onrender.com/api"
```

Para usar un backend local desde un teléfono físico, `localhost` no funciona.
Usar la IP de la computadora en la misma red, por ejemplo:

```env
EXPO_PUBLIC_API_URL="http://192.168.1.100:3000/api"
```

El backend debe permitir el origen del cliente web de Expo si se ejecuta en navegador.
Las aplicaciones Android/iOS nativas no dependen de CORS.

## Ejecución

Desde la raíz del monorepo:

```bash
pnpm install
pnpm --filter @heroes-tracker/mobile exec expo start --clear
```

En iPhone, abrir Expo Go y escanear el código QR. En Android, escanearlo desde
Expo Go o presionar `a` si hay un emulador o dispositivo conectado. La tecla `i`
abre el simulador de iOS únicamente en macOS; desde Windows se prueba iOS con un
iPhone físico o con una compilación EAS.

Si Expo muestra una incompatibilidad, confirmar que Expo Go esté actualizado y
que `npx expo config --type public` indique `sdkVersion: 54.0.0`.

## Verificación

```bash
pnpm --filter @heroes-tracker/mobile typecheck
pnpm --filter @heroes-tracker/mobile exec expo export --platform android
pnpm --filter @heroes-tracker/mobile exec expo export --platform ios
```

## EAS Build

Después de iniciar sesión con Expo:

```bash
npx eas-cli login
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile preview
```

El perfil `preview` genera un APK instalable en Android y una compilación interna
en iOS. Para instalar la compilación iOS en un dispositivo se necesita una cuenta
Apple Developer y registrar el equipo; para Expo Go no hace falta. Los perfiles
se encuentran en `mobile/eas.json`.
