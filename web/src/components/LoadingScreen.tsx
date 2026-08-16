import { Brand } from './Brand';

export function LoadingScreen() {
  return (
    <main className="loading-screen" aria-live="polite" aria-busy="true">
      <Brand />
      <span className="loading-screen__indicator" />
      <p>Verificando tu sesión segura…</p>
    </main>
  );
}
