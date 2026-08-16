import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import { getApiErrorMessage } from '../api/api-error';
import { useAuth } from '../auth/auth-context';
import { Modal } from '../components/Modal';
import { ResourceState } from '../components/ResourceState';
import {
  createMission,
  deleteMission,
  getMission,
  listHeroes,
  listMissions,
  updateMission,
} from '../domain/domain.api';
import {
  MISSION_DANGER_LEVELS,
  MISSION_STATES,
  type Hero,
  type Mission,
  type MissionDangerLevel,
  type MissionPayload,
  type MissionState,
} from '../domain/domain.types';

interface MissionFormState {
  titulo: string;
  descripcion: string;
  ubicacion: string;
  fecha: string;
  nivelPeligro: MissionDangerLevel;
  estado: MissionState;
  superheroeId: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(heroes: Hero[]): MissionFormState {
  return {
    titulo: '',
    descripcion: '',
    ubicacion: '',
    fecha: today(),
    nivelPeligro: 'MEDIO',
    estado: 'PENDIENTE',
    superheroeId: heroes[0]?.id ?? '',
  };
}

function missionToForm(mission: Mission): MissionFormState {
  return {
    titulo: mission.titulo,
    descripcion: mission.descripcion,
    ubicacion: mission.ubicacion,
    fecha: mission.fecha,
    nivelPeligro: mission.nivel_peligro,
    estado: mission.estado,
    superheroeId: mission.superheroe_id,
  };
}

function formToPayload(form: MissionFormState): MissionPayload {
  return {
    titulo: form.titulo.trim(),
    descripcion: form.descripcion.trim(),
    ubicacion: form.ubicacion.trim(),
    fecha: form.fecha,
    nivel_peligro: form.nivelPeligro,
    estado: form.estado,
    superheroe_id: form.superheroeId,
  };
}

function readableState(value: string): string {
  return value.replaceAll('_', ' ');
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function MissionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';
  const [missions, setMissions] = useState<Mission[]>([]);
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [stateFilter, setStateFilter] = useState('TODAS');
  const [dangerFilter, setDangerFilter] = useState('TODOS');
  const [notice, setNotice] = useState('');
  const [detailMission, setDetailMission] = useState<Mission | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<MissionFormState>(() => emptyForm([]));
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadResources = useCallback(async () => {
    setStatus('loading');
    try {
      const [missionData, heroData] = await Promise.all([listMissions(), listHeroes()]);
      setMissions(missionData);
      setHeroes(heroData);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([listMissions(), listHeroes()])
      .then(([missionData, heroData]) => {
        if (active) {
          setMissions(missionData);
          setHeroes(heroData);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleMissions = useMemo(
    () =>
      missions.filter(
        (mission) =>
          (stateFilter === 'TODAS' || mission.estado === stateFilter) &&
          (dangerFilter === 'TODOS' || mission.nivel_peligro === dangerFilter),
      ),
    [dangerFilter, missions, stateFilter],
  );

  async function openDetail(mission: Mission) {
    setDetailMission(mission);
    setDetailLoading(true);
    try {
      setDetailMission(await getMission(mission.id));
    } catch {
      setNotice('No se pudo actualizar el detalle de la misión.');
    } finally {
      setDetailLoading(false);
    }
  }

  function openCreate() {
    if (heroes.length === 0) {
      setNotice('Necesitas registrar al menos un héroe antes de crear una misión.');
      return;
    }
    setEditingMission(null);
    setForm(emptyForm(heroes));
    setFormError('');
    setFormOpen(true);
  }

  function openEdit(mission: Mission) {
    setEditingMission(mission);
    setForm(missionToForm(mission));
    setFormError('');
    setFormOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const savedMission = editingMission
        ? await updateMission(editingMission.id, formToPayload(form))
        : await createMission(formToPayload(form));
      setMissions((current) => {
        const remaining = current.filter(({ id }) => id !== savedMission.id);
        return [...remaining, savedMission].sort(
          (a, b) => b.fecha.localeCompare(a.fecha) || a.titulo.localeCompare(b.titulo),
        );
      });
      setFormOpen(false);
      setNotice(
        editingMission ? 'Misión actualizada correctamente.' : 'Misión creada correctamente.',
      );
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'No se pudo guardar la misión.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(mission: Mission) {
    if (!window.confirm(`¿Eliminar la misión “${mission.titulo}”?`)) return;
    setDeletingId(mission.id);
    try {
      await deleteMission(mission.id);
      setMissions((current) => current.filter(({ id }) => id !== mission.id));
      setNotice('Misión eliminada correctamente.');
    } catch (error) {
      setNotice(getApiErrorMessage(error, 'No se pudo eliminar la misión.'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="resource-page">
      <header className="resource-page__header">
        <div>
          <span className="resource-page__eyebrow">Control de operaciones</span>
          <h1>Misiones</h1>
          <p>Supervisa asignaciones, fechas, peligro y avance operativo.</p>
        </div>
        {isAdmin ? (
          <button className="button button--primary" type="button" onClick={openCreate}>
            <span aria-hidden="true">＋</span> Nueva misión
          </button>
        ) : (
          <span className="read-only-badge">Modo consulta</span>
        )}
      </header>

      {notice ? (
        <div className="page-notice" role="status">
          <span>{notice}</span>
          <button type="button" aria-label="Cerrar mensaje" onClick={() => setNotice('')}>
            ×
          </button>
        </div>
      ) : null}

      <section
        className="resource-toolbar resource-toolbar--filters"
        aria-label="Filtros de misiones"
      >
        <div className="filter-group">
          <label>
            Estado
            <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}>
              <option value="TODAS">Todas</option>
              {MISSION_STATES.map((state) => (
                <option value={state} key={state}>
                  {readableState(state)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Peligro
            <select value={dangerFilter} onChange={(event) => setDangerFilter(event.target.value)}>
              <option value="TODOS">Todos</option>
              {MISSION_DANGER_LEVELS.map((level) => (
                <option value={level} key={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
        </div>
        <span className="resource-count">
          <strong>{visibleMissions.length}</strong>{' '}
          {visibleMissions.length === 1 ? 'misión' : 'misiones'}
        </span>
      </section>

      {status === 'loading' ? (
        <ResourceState
          kind="loading"
          title="Consultando misiones"
          message="Sincronizando operaciones con la API."
        />
      ) : status === 'error' ? (
        <ResourceState
          kind="error"
          title="No pudimos cargar las misiones"
          message="Comprueba que el backend esté disponible y vuelve a intentarlo."
          onRetry={() => void loadResources()}
        />
      ) : visibleMissions.length === 0 ? (
        <ResourceState
          kind="empty"
          title={missions.length ? 'Sin resultados para estos filtros' : 'Todavía no hay misiones'}
          message={
            missions.length
              ? 'Cambia uno de los filtros para ampliar la búsqueda.'
              : 'El centro de operaciones está listo para su primera misión.'
          }
        />
      ) : (
        <section className="mission-list" aria-label="Listado de misiones">
          {visibleMissions.map((mission) => (
            <article className="mission-card" key={mission.id}>
              <div
                className={`mission-card__danger mission-card__danger--${mission.nivel_peligro.toLowerCase()}`}
              >
                <span>{mission.nivel_peligro}</span>
                <small>peligro</small>
              </div>
              <div className="mission-card__content">
                <div className="mission-card__heading">
                  <div>
                    <span
                      className={`mission-state mission-state--${mission.estado.toLowerCase()}`}
                    >
                      {readableState(mission.estado)}
                    </span>
                    <h2>{mission.titulo}</h2>
                  </div>
                  <span className="mission-card__date">{formatDate(mission.fecha)}</span>
                </div>
                <p>{mission.descripcion}</p>
                <div className="mission-card__meta">
                  <span>
                    <small>Ubicación</small>
                    <strong>{mission.ubicacion}</strong>
                  </span>
                  <span>
                    <small>Héroe asignado</small>
                    <strong>{mission.superheroe.nombre}</strong>
                  </span>
                </div>
              </div>
              <div className="mission-card__actions card-actions">
                <button type="button" onClick={() => void openDetail(mission)}>
                  Ver detalle
                </button>
                {isAdmin ? (
                  <>
                    <button type="button" onClick={() => openEdit(mission)}>
                      Editar
                    </button>
                    <button
                      className="card-actions__danger"
                      type="button"
                      disabled={deletingId === mission.id}
                      onClick={() => void handleDelete(mission)}
                    >
                      {deletingId === mission.id ? 'Eliminando…' : 'Eliminar'}
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      )}

      {detailMission ? (
        <Modal
          title={detailMission.titulo}
          description="Detalle de operación"
          onClose={() => setDetailMission(null)}
        >
          <div className="mission-detail">
            {detailLoading ? <span className="detail-sync">Actualizando datos…</span> : null}
            <div className="mission-detail__badges">
              <span
                className={`mission-state mission-state--${detailMission.estado.toLowerCase()}`}
              >
                {readableState(detailMission.estado)}
              </span>
              <span
                className={`danger-badge danger-badge--${detailMission.nivel_peligro.toLowerCase()}`}
              >
                Peligro {detailMission.nivel_peligro}
              </span>
            </div>
            <p>{detailMission.descripcion}</p>
            <dl className="detail-list detail-list--columns">
              <div>
                <dt>Fecha</dt>
                <dd>{formatDate(detailMission.fecha)}</dd>
              </div>
              <div>
                <dt>Ubicación</dt>
                <dd>{detailMission.ubicacion}</dd>
              </div>
              <div>
                <dt>Héroe asignado</dt>
                <dd>{detailMission.superheroe.nombre}</dd>
              </div>
              <div>
                <dt>Última actualización</dt>
                <dd>{new Date(detailMission.updated_at).toLocaleString('es-EC')}</dd>
              </div>
            </dl>
            {isAdmin ? (
              <button
                className="button button--secondary"
                type="button"
                onClick={() => {
                  setDetailMission(null);
                  openEdit(detailMission);
                }}
              >
                Editar misión
              </button>
            ) : null}
          </div>
        </Modal>
      ) : null}

      {formOpen ? (
        <Modal
          title={editingMission ? 'Editar misión' : 'Crear misión'}
          description={
            editingMission ? `Actualizando “${editingMission.titulo}”` : 'Nueva operación'
          }
          onClose={() => setFormOpen(false)}
        >
          <form className="resource-form" onSubmit={(event) => void handleSubmit(event)}>
            {formError ? (
              <div className="form-message form-message--error" role="alert">
                {formError}
              </div>
            ) : null}
            <div className="form-grid">
              <label className="form-grid__wide">
                Título
                <input
                  required
                  maxLength={160}
                  value={form.titulo}
                  onChange={(event) => setForm({ ...form, titulo: event.target.value })}
                />
              </label>
              <label className="form-grid__wide">
                Descripción
                <textarea
                  required
                  rows={4}
                  value={form.descripcion}
                  onChange={(event) => setForm({ ...form, descripcion: event.target.value })}
                />
              </label>
              <label>
                Ubicación
                <input
                  required
                  maxLength={160}
                  value={form.ubicacion}
                  onChange={(event) => setForm({ ...form, ubicacion: event.target.value })}
                />
              </label>
              <label>
                Fecha
                <input
                  required
                  type="date"
                  value={form.fecha}
                  onChange={(event) => setForm({ ...form, fecha: event.target.value })}
                />
              </label>
              <label>
                Nivel de peligro
                <select
                  value={form.nivelPeligro}
                  onChange={(event) =>
                    setForm({ ...form, nivelPeligro: event.target.value as MissionDangerLevel })
                  }
                >
                  {MISSION_DANGER_LEVELS.map((level) => (
                    <option value={level} key={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Estado
                <select
                  value={form.estado}
                  onChange={(event) =>
                    setForm({ ...form, estado: event.target.value as MissionState })
                  }
                >
                  {MISSION_STATES.map((state) => (
                    <option value={state} key={state}>
                      {readableState(state)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-grid__wide">
                Héroe asignado
                <select
                  required
                  value={form.superheroeId}
                  onChange={(event) => setForm({ ...form, superheroeId: event.target.value })}
                >
                  <option value="" disabled>
                    Selecciona un héroe
                  </option>
                  {heroes.map((hero) => (
                    <option value={hero.id} key={hero.id}>
                      {hero.nombre} — {hero.nombre_real}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-actions">
              <button
                className="button button--ghost"
                type="button"
                onClick={() => setFormOpen(false)}
              >
                Cancelar
              </button>
              <button className="button button--primary" type="submit" disabled={saving}>
                {saving ? 'Guardando…' : editingMission ? 'Guardar cambios' : 'Crear misión'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </main>
  );
}
