import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { getApiErrorMessage } from '../api/api-error';
import { useAuth } from '../auth/auth-context';
import { Brand } from '../components/Brand';
import { Icon } from '../components/Icon';

interface LoginLocationState {
  from?: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({ email, password });
      const state = location.state as LoginLocationState | null;
      navigate(state?.from || '/app', { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Email o contraseña incorrectos.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual" aria-label="Presentación de Heroes Tracker">
        <div className="login-visual__grid" />
        <span className="login-visual__orb login-visual__orb--one" />
        <span className="login-visual__orb login-visual__orb--two" />

        <div className="login-visual__content">
          <Brand />
          <div className="login-visual__copy">
            <span className="section-kicker">
              <Icon name="spark" /> Plataforma de operaciones
            </span>
            <h1>
              Cada héroe.
              <br /> Cada misión.
              <br /> <em>Bajo control.</em>
            </h1>
            <p>
              Coordina capacidades, asignaciones y estados desde un único centro de mando seguro.
            </p>
          </div>

          <div className="login-visual__features">
            <span>
              <Icon name="check" /> Acceso por roles
            </span>
            <span>
              <Icon name="check" /> Sesiones protegidas
            </span>
            <span>
              <Icon name="check" /> Información centralizada
            </span>
          </div>
        </div>

        <div className="login-visual__signal">
          <span /> Conexión cifrada
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel__mobile-brand">
          <Brand />
        </div>

        <div className="login-card">
          <div className="login-card__heading">
            <span className="login-card__icon">
              <Icon name="shield" />
            </span>
            <div>
              <p>Acceso autorizado</p>
              <h2>Bienvenido de nuevo</h2>
            </div>
          </div>
          <p className="login-card__lead">
            Ingresa tus credenciales para abrir el centro de mando.
          </p>

          <form onSubmit={(event) => void handleSubmit(event)}>
            <label className="field">
              <span>Correo electrónico</span>
              <input
                type="email"
                name="email"
                placeholder="nombre@organizacion.com"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Contraseña</span>
              <span className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} />
                </button>
              </span>
            </label>

            {error ? (
              <div className="form-error" role="alert">
                <span>!</span>
                {error}
              </div>
            ) : null}

            <button className="primary-button" type="submit" disabled={submitting}>
              <span>{submitting ? 'Verificando acceso…' : 'Ingresar al sistema'}</span>
              {submitting ? <i className="button-spinner" /> : <Icon name="arrow-right" />}
            </button>
          </form>

          <div className="login-card__help">
            <span />
            Las credenciales son administradas por tu organización.
          </div>
        </div>

        <p className="login-panel__footer">Heroes Tracker · Centro de operaciones</p>
      </section>
    </main>
  );
}
