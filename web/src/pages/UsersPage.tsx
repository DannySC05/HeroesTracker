import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import { getApiErrorMessage } from '../api/api-error';
import { Modal } from '../components/Modal';
import { ResourceState } from '../components/ResourceState';
import {
  createConsultationUser,
  listConsultationUsers,
  updateConsultationUser,
} from '../users/user.api';
import type { ConsultationUser } from '../users/user.types';

interface UserFormState {
  nombre: string;
  email: string;
  password: string;
  activo: boolean;
}

const emptyForm: UserFormState = { nombre: '', email: '', password: '', activo: true };

export function UsersPage() {
  const [users, setUsers] = useState<ConsultationUser[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [filter, setFilter] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');
  const [editingUser, setEditingUser] = useState<ConsultationUser | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [changingId, setChangingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setStatus('loading');
    try {
      setUsers(await listConsultationUsers());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    let active = true;
    listConsultationUsers()
      .then((data) => {
        if (active) {
          setUsers(data);
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

  const visibleUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          filter === 'TODOS' ||
          (filter === 'ACTIVOS' && user.activo) ||
          (filter === 'INACTIVOS' && !user.activo),
      ),
    [filter, users],
  );

  const activeCount = users.filter((user) => user.activo).length;

  function openCreate() {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError('');
    setFormOpen(true);
  }

  function openEdit(user: ConsultationUser) {
    setEditingUser(user);
    setForm({ nombre: user.nombre, email: user.email, password: '', activo: user.activo });
    setFormError('');
    setFormOpen(true);
  }

  function replaceUser(saved: ConsultationUser) {
    setUsers((current) =>
      current
        .filter((user) => user.id !== saved.id)
        .concat(saved)
        .sort((left, right) => left.nombre.localeCompare(right.nombre)),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const nombre = form.nombre.trim();
      const email = form.email.trim().toLowerCase();
      const saved = editingUser
        ? await updateConsultationUser(editingUser.id, {
            nombre,
            email,
            activo: form.activo,
            ...(form.password ? { password: form.password } : {}),
          })
        : await createConsultationUser({ nombre, email, password: form.password });
      replaceUser(saved);
      setFormOpen(false);
      setNotice(
        editingUser ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.',
      );
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'No se pudo guardar el usuario.'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleUser(user: ConsultationUser) {
    const action = user.activo ? 'desactivar' : 'reactivar';
    if (!window.confirm(`¿Deseas ${action} a ${user.nombre}?`)) return;
    setChangingId(user.id);
    try {
      const saved = await updateConsultationUser(user.id, {
        nombre: user.nombre,
        email: user.email,
        activo: !user.activo,
      });
      replaceUser(saved);
      setNotice(`Usuario ${saved.activo ? 'reactivado' : 'desactivado'} correctamente.`);
    } catch (error) {
      setNotice(getApiErrorMessage(error, `No se pudo ${action} el usuario.`));
    } finally {
      setChangingId(null);
    }
  }

  return (
    <main className="resource-page">
      <header className="resource-page__header">
        <div>
          <span className="resource-page__eyebrow">Administración de acceso</span>
          <h1>Usuarios</h1>
          <p>Crea y controla las cuentas con permisos de consulta.</p>
        </div>
        <button className="button button--primary" type="button" onClick={openCreate}>
          <span aria-hidden="true">＋</span> Nuevo usuario
        </button>
      </header>

      {notice ? (
        <div className="page-notice" role="status">
          <span>{notice}</span>
          <button type="button" aria-label="Cerrar mensaje" onClick={() => setNotice('')}>
            ×
          </button>
        </div>
      ) : null}

      <section className="user-summary" aria-label="Resumen de usuarios">
        <div>
          <strong>{users.length}</strong>
          <span>Cuentas registradas</span>
        </div>
        <div>
          <strong>{activeCount}</strong>
          <span>Accesos activos</span>
        </div>
        <div>
          <strong>{users.length - activeCount}</strong>
          <span>Accesos suspendidos</span>
        </div>
      </section>

      <section className="resource-toolbar resource-toolbar--filters">
        <div className="filter-group">
          <label>
            Estado
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as typeof filter)}
            >
              <option value="TODOS">Todos</option>
              <option value="ACTIVOS">Activos</option>
              <option value="INACTIVOS">Inactivos</option>
            </select>
          </label>
        </div>
        <div className="resource-toolbar__meta">
          <strong>{visibleUsers.length}</strong>
          <span>resultados</span>
        </div>
      </section>

      {status === 'loading' ? (
        <ResourceState
          kind="loading"
          title="Sincronizando usuarios"
          message="Consultando las cuentas de acceso."
        />
      ) : null}
      {status === 'error' ? (
        <ResourceState
          kind="error"
          title="No se pudieron cargar los usuarios"
          message="Verifica la conexión con la API."
          onRetry={() => void loadUsers()}
        />
      ) : null}
      {status === 'ready' && visibleUsers.length === 0 ? (
        <ResourceState
          kind="empty"
          title="No hay usuarios en este estado"
          message="Cambia el filtro o registra una nueva cuenta."
        />
      ) : null}

      {status === 'ready' && visibleUsers.length > 0 ? (
        <section className="user-list" aria-label="Usuarios de consulta">
          {visibleUsers.map((user) => (
            <article className="user-card" key={user.id}>
              <span className="user-card__avatar">{user.nombre.slice(0, 2).toUpperCase()}</span>
              <div className="user-card__identity">
                <span className={`status-pill${user.activo ? '' : ' status-pill--inactivo'}`}>
                  {user.activo ? 'ACTIVO' : 'INACTIVO'}
                </span>
                <h2>{user.nombre}</h2>
                <p>{user.email}</p>
              </div>
              <div className="user-card__role">
                <span>ROL</span>
                <strong>CONSULTA</strong>
              </div>
              <div className="user-card__actions">
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => openEdit(user)}
                >
                  Editar
                </button>
                <button
                  className="button button--ghost"
                  type="button"
                  disabled={changingId === user.id}
                  onClick={() => void toggleUser(user)}
                >
                  {user.activo ? 'Desactivar' : 'Reactivar'}
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {formOpen ? (
        <Modal
          title={editingUser ? 'Editar usuario' : 'Nuevo usuario de consulta'}
          description={
            editingUser
              ? 'Deja la contraseña vacía para conservar la actual.'
              : 'La cuenta tendrá acceso de solo lectura.'
          }
          onClose={() => setFormOpen(false)}
        >
          <form className="resource-form" onSubmit={(event) => void handleSubmit(event)}>
            {formError ? <div className="form-message form-message--error">{formError}</div> : null}
            <div className="form-grid">
              <label>
                Nombre
                <input
                  required
                  maxLength={100}
                  value={form.nombre}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, nombre: event.target.value }))
                  }
                />
              </label>
              <label>
                Email
                <input
                  required
                  type="email"
                  maxLength={254}
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>
              <label className="form-grid__wide">
                {editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                <input
                  required={!editingUser}
                  type="password"
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                />
              </label>
              {editingUser ? (
                <label className="form-grid__wide">
                  Estado
                  <select
                    value={form.activo ? 'ACTIVO' : 'INACTIVO'}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        activo: event.target.value === 'ACTIVO',
                      }))
                    }
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </label>
              ) : null}
            </div>
            <div className="form-actions">
              <button
                className="button button--ghost"
                type="button"
                onClick={() => setFormOpen(false)}
              >
                Cancelar
              </button>
              <button className="button button--primary" disabled={saving} type="submit">
                {saving ? 'Guardando…' : 'Guardar usuario'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </main>
  );
}
