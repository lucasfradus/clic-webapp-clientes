import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { updatePerfil } from '../api/perfil';
import { ApiError } from '../api/client';
import { toast } from '../store/toast';
import './Forms.css';

const SEXOS = [
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMENINO', label: 'Femenino' },
  { value: 'OTRO', label: 'Otro' },
] as const;

export default function EditarPerfil() {
  const perfil = useAuth((s) => s.perfil);
  const fetchPerfil = useAuth((s) => s.fetchPerfil);
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dni, setDni] = useState('');
  const [direccion, setDireccion] = useState('');
  const [sexo, setSexo] = useState<string>('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!perfil) return;
    setNombre(perfil.nombre ?? '');
    setApellido(perfil.apellido ?? '');
    setTelefono(perfil.telefono ?? '');
    setDni(perfil.dni ?? '');
    setDireccion(perfil.direccion ?? '');
    setSexo(perfil.sexo ?? '');
    setFechaNacimiento(perfil.fechaNacimiento?.slice(0, 10) ?? '');
  }, [perfil]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !apellido.trim()) {
      toast.error('Nombre y apellido son obligatorios');
      return;
    }
    setSaving(true);
    try {
      await updatePerfil({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim() || null,
        dni: dni.trim() || null,
        sexo: sexo || null,
        direccion: direccion.trim() || null,
        fechaNacimiento: fechaNacimiento || null,
      });
      await fetchPerfil();
      toast.success('Perfil actualizado');
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
        <div className="tag-label">Datos personales</div>
        <h1 className="page-title">Editar</h1>
      </header>

      <form className="card form-card" onSubmit={onSubmit}>
        <label className="form-field">
          <span className="tag-label">Email</span>
          <input type="email" value={perfil?.email ?? ''} disabled />
        </label>

        <div className="form-row">
          <label className="form-field">
            <span className="tag-label">Nombre *</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </label>
          <label className="form-field">
            <span className="tag-label">Apellido *</span>
            <input
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
            />
          </label>
        </div>

        <label className="form-field">
          <span className="tag-label">Teléfono</span>
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </label>

        <label className="form-field">
          <span className="tag-label">DNI</span>
          <input value={dni} onChange={(e) => setDni(e.target.value)} />
        </label>

        <label className="form-field">
          <span className="tag-label">Dirección</span>
          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
          />
        </label>

        <label className="form-field">
          <span className="tag-label">Fecha de nacimiento</span>
          <input
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
          />
        </label>

        <div className="form-field">
          <span className="tag-label">Sexo</span>
          <div className="pills">
            {SEXOS.map((s) => (
              <button
                key={s.value}
                type="button"
                className={'pill' + (sexo === s.value ? ' active' : '')}
                onClick={() => setSexo(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <button className="btn-taupe form-submit" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
