import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { getApiErrorMessage } from '../api/api-error';
import { useAuth } from '../auth/auth-context';
import { Modal } from '../components/Modal';
import { ResourceState } from '../components/ResourceState';
import { createHero, deleteHero, getHero, listHeroes, updateHero } from '../domain/domain.api';
import { HERO_STATES, type Hero, type HeroPayload, type HeroState } from '../domain/domain.types';

interface HeroFormState {
  nombre: string;
  nombreReal: string;
  poderPrincipal: string;
  nivelPoder: string;
  imagenUrl: string;
  estado: HeroState;
}

const emptyForm: HeroFormState = {
  nombre: '',
  nombreReal: '',
  poderPrincipal: '',
  nivelPoder: '50',
  imagenUrl: '',
  estado: 'ACTIVO',
};

function heroToForm(hero: Hero): HeroFormState {
  return {
    nombre: hero.nombre,
    nombreReal: hero.nombre_real,
    poderPrincipal: hero.poder_principal,
    nivelPoder: String(hero.nivel_poder),
    imagenUrl: hero.imagen_url,
    estado: hero.estado,
  };
}

function formToPayload(form: HeroFormState): HeroPayload {
  return {
    nombre: form.nombre.trim(),
    nombre_real: form.nombreReal.trim(),
    poder_principal: form.poderPrincipal.trim(),
    nivel_poder: Number(form.nivelPoder),
    imagen_url: form.imagenUrl.trim(),
    estado: form.estado,
  };
}

export function HeroesPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [detailHero, setDetailHero] = useState<Hero | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingHero, setEditingHero] = useState<Hero | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<HeroFormState>(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadHeroes = useCallback(async (nombre = '') => {
    setStatus('loading');
    try {
      setHeroes(await listHeroes(nombre || undefined));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    let active = true;

    listHeroes()
      .then((data) => {
        if (active) {
          setHeroes(data);
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

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    const nextSearch = search.trim();
    setAppliedSearch(nextSearch);
    await loadHeroes(nextSearch);
  }

  function clearSearch() {
    setSearch('');
    setAppliedSearch('');
    void loadHeroes();
  }

  async function openDetail(hero: Hero) {
    setDetailHero(hero);
    setDetailLoading(true);
    try {
      setDetailHero(await getHero(hero.id));
    } catch {
      setNotice('No se pudo actualizar el detalle del héroe.');
    } finally {
      setDetailLoading(false);
    }
  }

  function openCreate() {
    setEditingHero(null);
    setForm(emptyForm);
    setFormError('');
    setFormOpen(true);
  }

  function openEdit(hero: Hero) {
    setEditingHero(hero);
    setForm(heroToForm(hero));
    setFormError('');
    setFormOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');

    try {
      const savedHero = editingHero
        ? await updateHero(editingHero.id, formToPayload(form))
        : await createHero(formToPayload(form));
      setHeroes((current) => {
        const remaining = current.filter(({ id }) => id !== savedHero.id);
        return [...remaining, savedHero].sort((a, b) => a.nombre.localeCompare(b.nombre));
      });
      setFormOpen(false);
      setNotice(editingHero ? 'Héroe actualizado correctamente.' : 'Héroe creado correctamente.');
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'No se pudo guardar el héroe.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(hero: Hero) {
    if (!window.confirm(`¿Eliminar a ${hero.nombre}? Esta acción no se puede deshacer.`)) return;

    setDeletingId(hero.id);
    try {
      await deleteHero(hero.id);
      setHeroes((current) => current.filter(({ id }) => id !== hero.id));
      setNotice('Héroe eliminado correctamente.');
    } catch (error) {
      setNotice(getApiErrorMessage(error, 'No se pudo eliminar el héroe.'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="resource-page">
      <header className="resource-page__header">
        <div>
          <span className="resource-page__eyebrow">Directorio operativo</span>
          <h1>Héroes</h1>
          <p>Consulta capacidades, identidad y disponibilidad del equipo.</p>
        </div>
        {isAdmin ? (
          <button className="button button--primary" type="button" onClick={openCreate}>
            <span aria-hidden="true">＋</span> Nuevo héroe
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

      <section className="resource-toolbar" aria-label="Herramientas de héroes">
        <form
          className="resource-search"
          role="search"
          onSubmit={(event) => void handleSearch(event)}
        >
          <span aria-hidden="true">⌕</span>
          <label className="sr-only" htmlFor="hero-search">
            Buscar héroes por nombre
          </label>
          <input
            id="hero-search"
            value={search}
            placeholder="Buscar por nombre..."
            maxLength={100}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className="button button--secondary" type="submit">
            Buscar
          </button>
          {appliedSearch ? (
            <button className="button button--ghost" type="button" onClick={clearSearch}>
              Limpiar
            </button>
          ) : null}
        </form>
        <span className="resource-count">
          <strong>{heroes.length}</strong> {heroes.length === 1 ? 'héroe' : 'héroes'}
        </span>
      </section>

      {status === 'loading' ? (
        <ResourceState
          kind="loading"
          title="Consultando héroes"
          message="Sincronizando el directorio con la API."
        />
      ) : status === 'error' ? (
        <ResourceState
          kind="error"
          title="No pudimos cargar los héroes"
          message="Comprueba que el backend esté disponible y vuelve a intentarlo."
          onRetry={() => void loadHeroes(appliedSearch)}
        />
      ) : heroes.length === 0 ? (
        <ResourceState
          kind="empty"
          title={appliedSearch ? 'Sin coincidencias' : 'Todavía no hay héroes'}
          message={
            appliedSearch
              ? `No encontramos héroes relacionados con “${appliedSearch}”.`
              : 'El directorio está listo para recibir su primer integrante.'
          }
        />
      ) : (
        <section className="hero-grid" aria-label="Listado de héroes">
          {heroes.map((hero) => (
            <article className="hero-card" key={hero.id}>
              <button
                className="hero-card__visual"
                type="button"
                onClick={() => void openDetail(hero)}
              >
                <img src={hero.imagen_url} alt="" />
                <span className={`status-pill status-pill--${hero.estado.toLowerCase()}`}>
                  {hero.estado}
                </span>
                <span className="power-meter">
                  <i style={{ width: `${hero.nivel_poder}%` }} />
                </span>
              </button>
              <div className="hero-card__body">
                <div>
                  <p>{hero.nombre_real}</p>
                  <h2>{hero.nombre}</h2>
                </div>
                <p className="hero-card__power">{hero.poder_principal}</p>
                <div className="hero-card__footer">
                  <span>
                    <strong>{hero.nivel_poder}</strong>/100 poder
                  </span>
                  <div className="card-actions">
                    <button type="button" onClick={() => void openDetail(hero)}>
                      Ver detalle
                    </button>
                    {isAdmin ? (
                      <>
                        <button type="button" onClick={() => openEdit(hero)}>
                          Editar
                        </button>
                        <button
                          className="card-actions__danger"
                          type="button"
                          disabled={deletingId === hero.id}
                          onClick={() => void handleDelete(hero)}
                        >
                          {deletingId === hero.id ? 'Eliminando…' : 'Eliminar'}
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {detailHero ? (
        <Modal
          title={detailHero.nombre}
          description="Ficha operativa"
          onClose={() => setDetailHero(null)}
        >
          <div className="hero-detail">
            <img src={detailHero.imagen_url} alt={`Retrato de ${detailHero.nombre}`} />
            <div>
              {detailLoading ? <span className="detail-sync">Actualizando datos…</span> : null}
              <span className={`status-pill status-pill--${detailHero.estado.toLowerCase()}`}>
                {detailHero.estado}
              </span>
              <dl className="detail-list">
                <div>
                  <dt>Identidad</dt>
                  <dd>{detailHero.nombre_real}</dd>
                </div>
                <div>
                  <dt>Poder principal</dt>
                  <dd>{detailHero.poder_principal}</dd>
                </div>
                <div>
                  <dt>Nivel de poder</dt>
                  <dd>{detailHero.nivel_poder} / 100</dd>
                </div>
              </dl>
              {isAdmin ? (
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => {
                    setDetailHero(null);
                    openEdit(detailHero);
                  }}
                >
                  Editar ficha
                </button>
              ) : null}
            </div>
          </div>
        </Modal>
      ) : null}

      {formOpen ? (
        <Modal
          title={editingHero ? 'Editar héroe' : 'Registrar héroe'}
          description={
            editingHero ? `Actualizando a ${editingHero.nombre}` : 'Nueva ficha del directorio'
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
              <label>
                Nombre heroico
                <input
                  required
                  maxLength={100}
                  value={form.nombre}
                  onChange={(event) => setForm({ ...form, nombre: event.target.value })}
                />
              </label>
              <label>
                Nombre real
                <input
                  required
                  maxLength={120}
                  value={form.nombreReal}
                  onChange={(event) => setForm({ ...form, nombreReal: event.target.value })}
                />
              </label>
              <label className="form-grid__wide">
                Poder principal
                <input
                  required
                  maxLength={160}
                  value={form.poderPrincipal}
                  onChange={(event) => setForm({ ...form, poderPrincipal: event.target.value })}
                />
              </label>
              <label>
                Nivel de poder
                <input
                  required
                  type="number"
                  min="1"
                  max="100"
                  value={form.nivelPoder}
                  onChange={(event) => setForm({ ...form, nivelPoder: event.target.value })}
                />
              </label>
              <label>
                Estado
                <select
                  value={form.estado}
                  onChange={(event) =>
                    setForm({ ...form, estado: event.target.value as HeroState })
                  }
                >
                  {HERO_STATES.map((state) => (
                    <option value={state} key={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-grid__wide">
                URL de imagen
                <input
                  required
                  type="url"
                  placeholder="https://..."
                  value={form.imagenUrl}
                  onChange={(event) => setForm({ ...form, imagenUrl: event.target.value })}
                />
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
                {saving ? 'Guardando…' : editingHero ? 'Guardar cambios' : 'Crear héroe'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </main>
  );
}
