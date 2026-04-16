import { useState, type FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { ApiError } from '../api/client';
import logoBlack from '../assets/clic_logo_black_transparent.png';
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
        <img src={logoBlack} alt="CLIC" className="login-logo" />
        <div className="italiana login-tagline">studio pilates</div>

        <h1 className="page-title login-title">Bienvenida</h1>
        <div className="tag-label">Tu espacio de práctica</div>

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
