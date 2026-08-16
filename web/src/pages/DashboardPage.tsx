import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/auth-context';
import { Icon } from '../components/Icon';
import { listHeroes, listMissions } from '../domain/domain.api';

interface DashboardMetrics {
  activeHeroes: number;
  completedMissions: number;
  missionsInProgress: number;
}

const emptyMetrics: DashboardMetrics = {
  activeHeroes: 0,
  completedMissions: 0,
  missionsInProgress: 0,
};

export function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.nombre.split(/\s+/)[0] || 'agente';
  const isAdmin = user?.rol === 'ADMIN';
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics);
  const [metricsStatus, setMetricsStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let isMounted = true;

    async function loadMetrics() {
      setMetricsStatus('loading');

      try {
        const [heroes, missions] = await Promise.all([listHeroes(), listMissions()]);

        if (!isMounted) return;

        setMetrics({
          activeHeroes: heroes.filter((hero) => hero.estado === 'ACTIVO').length,
          completedMissions: missions.filter((mission) => mission.estado === 'COMPLETADA').length,
          missionsInProgress: missions.filter((mission) => mission.estado === 'EN_PROGRESO').length,
        });
        setMetricsStatus('ready');
      } catch {
        if (isMounted) setMetricsStatus('error');
      }
    }

    void loadMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  const metricValue = (value: number) => {
    if (metricsStatus === 'loading') return '…';
    if (metricsStatus === 'error') return '—';
    return value.toString();
  };

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

      <section className="dashboard__section" aria-labelledby="metrics-title">
        <div className="section-heading">
          <div>
            <p>Estado general</p>
            <h2 id="metrics-title">Resumen operativo</h2>
          </div>
          <span aria-live="polite">
            {metricsStatus === 'loading' && 'Actualizando indicadores'}
            {metricsStatus === 'ready' && 'Datos actualizados'}
            {metricsStatus === 'error' && 'Datos no disponibles'}
          </span>
        </div>

        <div className="metrics-grid" aria-label="Indicadores operativos">
          <Link className="metric-card metric-card--heroes" to="/app/heroes">
            <span className="metric-card__icon">
              <Icon name="users" />
            </span>
            <span className="metric-card__content">
              <strong>{metricValue(metrics.activeHeroes)}</strong>
              <span>Héroes activos</span>
              <small>Disponibles para operaciones</small>
            </span>
          </Link>

          <Link className="metric-card metric-card--completed" to="/app/misiones">
            <span className="metric-card__icon">
              <Icon name="check" />
            </span>
            <span className="metric-card__content">
              <strong>{metricValue(metrics.completedMissions)}</strong>
              <span>Misiones completadas</span>
              <small>Operaciones finalizadas</small>
            </span>
          </Link>

          <Link className="metric-card metric-card--progress" to="/app/misiones">
            <span className="metric-card__icon">
              <Icon name="target" />
            </span>
            <span className="metric-card__content">
              <strong>{metricValue(metrics.missionsInProgress)}</strong>
              <span>Misiones en progreso</span>
              <small>Operaciones actualmente activas</small>
            </span>
          </Link>
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
