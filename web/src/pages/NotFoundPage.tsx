import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="not-found">
      <span>404</span>
      <h1>Coordenadas no encontradas</h1>
      <p>La ruta solicitada no pertenece al centro de operaciones.</p>
      <Link className="primary-button" to="/">
        Volver al inicio
      </Link>
    </main>
  );
}
