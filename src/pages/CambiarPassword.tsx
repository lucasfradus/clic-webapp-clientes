import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../api/auth';
import { ApiError } from '../api/client';
import { toast } from '../store/toast';
import './Forms.css';

export default function CambiarPassword() {
  const navigate = useNavigate();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (nueva.length < 6) {
      toast.error('La contraseña nueva debe tener al menos 6 caracteres');
      return;
    }
    if (nueva !== confirmar) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setSaving(true);
    try {
      await changePassword(actual, nueva);
      toast.success('Contraseña actualizada');
      navigate('/perfil');
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page form-page">
      <header className="form-head">
        <button className="form-back" onClick={() => navigate('/perfil')}>
          ← Perfil
        </button>
        <div className="tag-label">Seguridad</div>
        <h1 className="page-title">Cambiar contraseña</h1>
      </header>

      <form className="card form-card" onSubmit={onSubmit}>
        <label className="form-field">
          <span className="tag-label">Contraseña actual</span>
          <input
            type="password"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            required
          />
        </label>
        <label className="form-field">
          <span className="tag-label">Nueva contraseña</span>
          <input
            type="password"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            required
            minLength={6}
          />
        </label>
        <label className="form-field">
          <span className="tag-label">Confirmar nueva contraseña</span>
          <input
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            required
          />
        </label>
        <button className="btn-taupe form-submit" disabled={saving}>
          {saving ? 'Guardando…' : 'Actualizar contraseña'}
        </button>
      </form>
    </div>
  );
}
