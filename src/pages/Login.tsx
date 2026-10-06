import { useState, type FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { ApiError } from '../api/client';
import { useBrand } from '../brand/context';
import './Login.css';

export default function Login() {
  const login = useAuth((s) => s.login);
  const loading = useAuth((s) => s.loading);
  const token = useAuth((s) => s.token);
  const perfil = useAuth((s) => s.perfil);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const brand = useBrand();

  if (token && perfil) {
    return (
      <Navigate
        to={perfil.consentimientoFirmado ? '/' : '/consentimiento'}
        replace
      />
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email.trim(), password);
      const p = useAuth.getState().perfil;
      navigate(p?.consentimientoFirmado ? '/' : '/consentimiento', {
        replace: true,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) setError('Credenciales inválidas');
        else if (err.status === 403)
          setError('Esta cuenta no es de alumno');
        else if (err.status === 429)
          setError('Demasiados intentos. Esperá unos minutos.');
        else setError(err.message);
      } else {
        setError('Error inesperado');
      }
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {brand.appStoreUrl && (
          <a
            href={brand.appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="login-app-banner"
          >
            <span className="login-app-banner-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-2.99-.79-1.54.02-2.96.9-3.75 2.27-1.6 2.78-.41 6.89 1.15 9.14.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.39-.92-2.41-3.66zM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.01.61-2.66 1.37-.58.67-1.1 1.76-.96 2.8 1.01.08 2.05-.52 2.68-1.28z" />
              </svg>
            </span>
            <span className="login-app-banner-text">
              <strong>¡Ya está la app en el App Store!</strong>
              <span>Descargala para reservar desde tu iPhone</span>
            </span>
            <span className="login-app-banner-arrow" aria-hidden="true">→</span>
          </a>
        )}
        <img src={brand.logos.logoBlack} alt={brand.text.fullName} className="login-logo" />
        <div className="italiana login-tagline">{brand.text.tagline}</div>

        <h1 className="page-title login-title">{brand.text.loginWelcome}</h1>
        <div className="tag-label">{brand.text.loginSubtitle}</div>

        <form onSubmit={onSubmit} className="login-form">
          <label className="login-field">
            <span className="tag-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className="login-field">
            <span className="tag-label">Contraseña</span>
            <div className="login-pw-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-pw-toggle"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </label>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="btn-taupe login-submit"
            disabled={loading}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
