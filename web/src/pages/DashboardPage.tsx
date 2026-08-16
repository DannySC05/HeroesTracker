import { useAuth } from '../auth/auth-context';
import { Icon } from '../components/Icon';

export function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.nombre.split(/\s+/)[0] || 'agente';
  const isAdmin = user?.rol === 'ADMIN';

  return (
    <main className="dashboard">
      <section className="dashboard__hero">
        <div>
          <span className="section-kicker">
            <Icon name="spark" /> Centro de operaciones
          </span>
          <h1>Buen trabajo, {firstName}.</h1>
          <p>Tu sesión está activa y el sistema está listo para coordinar héroes y misiones.</p>
        </div>
        <div className="dashboard__role-card">
          <span className={`role-badge role-badge--${user?.rol.toLowerCase()}`}>{user?.rol}</span>
          <strong>{isAdmin ? 'Control operativo completo' : 'Acceso de consulta'}</strong>
          <small>
            {isAdmin
              ? 'Podrás crear, actualizar y cerrar operaciones.'
              : 'Podrás explorar toda la información disponible.'}
          </small>
        </div>
      </section>

      <section className="dashboard__section" aria-labelledby="modules-title">
        <div className="section-heading">
          <div>
            <p>Capacidades activas</p>
            <h2 id="modules-title">Módulos operativos</h2>
          </div>
          <span>Conectados a la API</span>
        </div>

        <div className="module-grid">
          <Link className="module-card module-card--heroes" to="/app/heroes">
            <span className="module-card__icon">
              <Icon name="users" />
            </span>
            <div>
              <span className="module-card__tag">Directorio</span>
              <h3>Gestión de héroes</h3>
              <p>Consulta perfiles, capacidades, nivel de poder y estado operativo.</p>
            </div>
            <span className="module-card__status">
              <i /> Abrir directorio
            </span>
          </Link>

          <Link className="module-card module-card--missions" to="/app/misiones">
            <span className="module-card__icon">
              <Icon name="target" />
            </span>
            <div>
              <span className="module-card__tag">Operaciones</span>
              <h3>Control de misiones</h3>
              <p>Supervisa asignaciones, fechas, peligro y avance de cada operación.</p>
            </div>
            <span className="module-card__status">
              <i /> Abrir operaciones
            </span>
          </Link>
        </div>
      </section>

      <section className="dashboard__section dashboard__security" aria-labelledby="security-title">
        <div className="section-heading">
          <div>
            <p>Estado de acceso</p>
            <h2 id="security-title">Sesión protegida</h2>
          </div>
        </div>

        <div className="security-strip">
          <div>
            <span className="security-strip__icon">
              <Icon name="shield" />
            </span>
            <span>
              <strong>Identidad verificada</strong>
              <small>{user?.email}</small>
            </span>
          </div>
          <div>
            <Icon name="check" />
            <span>
              <strong>Token activo</strong>
              <small>Validado por la API</small>
            </span>
          </div>
          <div>
            <Icon name="check" />
            <span>
              <strong>Permisos aplicados</strong>
              <small>Perfil {user?.rol}</small>
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
import { Link } from 'react-router';
