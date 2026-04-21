import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Watermark from '../components/brand/Watermark';
import isoTaupe from '../assets/clic_iso_taupe_transparent.png';
import { useAuth } from '../store/auth';
import { getTurnos } from '../api/turnos';
import { getSuscripciones } from '../api/suscripciones';
import { getSede } from '../api/perfil';
import type { Turno, Suscripcion, Sede } from '../types';
import { parse } from '../lib/date';
import { ApiError } from '../api/client';
import { toast } from '../store/toast';
import './Perfil.css';

const MESES = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export default function Perfil() {
  const perfil = useAuth((s) => s.perfil);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const [historial, setHistorial] = useState<Turno[]>([]);
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [sede, setSede] = useState<Sede | null>(null);

  useEffect(() => {
    Promise.all([getTurnos('historial'), getSuscripciones(), getSede()])
      .then(([h, s, sd]) => {
        setHistorial(h);
        setSuscripciones(s);
        setSede(sd);
      })
      .catch((e: ApiError) => toast.error(e.message));
  }, []);

  const asistidos = historial.filter((t) => t.estado === 'ASISTIO');
  const activa = suscripciones.find((s) => s.estado === 'ACTIVA');
  const restantes = activa
    ? activa.accesos + activa.accesosExtra - activa.accesosUsados
    : 0;

  const progressByMonth = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; count: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: MESES[d.getMonth()],
        count: 0,
      });
    }
    for (const t of asistidos) {
      const d = parse(t.inicio);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const m = months.find((x) => x.key === key);
      if (m) m.count++;
    }
    const max = Math.max(1, ...months.map((m) => m.count));
    return months.map((m) => ({ ...m, v: m.count / max }));
  }, [asistidos]);

  const memberSince = perfil
    ? new Date(perfil.fechaRegistro).getFullYear()
    : '';

  const initial = (perfil?.nombre ?? '?').charAt(0).toUpperCase();

  const whatsappHref =
    sede?.telefono
      ? `https://wa.me/${sede.telefono.replace(/[^\d]/g, '')}`
      : null;

  const menu = [
    { label: 'Datos personales', icon: '☺', to: '/perfil/editar' },
    { label: 'Cambiar contraseña', icon: '⚙', to: '/perfil/password' },
    { label: 'Consentimiento informado', icon: '✎', to: '/perfil/consentimiento' },
    { label: 'Políticas del establecimiento', icon: '§', to: '/perfil/politicas' },
  ];

  return (
    <div className="page perfil">
      <header className="perfil-head">
        <div className="tag-label">Tu perfil</div>
        <h1 className="page-title">Perfil</h1>
      </header>

      <div className="perfil-grid">
        <div className="card-dark perfil-hero">
          <Watermark
            color="accent"
            size={28}
            opacity={0.9}
            position={{ top: 24, right: 24 }}
          />
          <div className="perfil-avatar italiana">{initial}</div>
          <div className="perfil-name italiana">
            {perfil?.nombre} {perfil?.apellido}
          </div>
          <div
            className="tag-label"
            style={{ color: 'rgba(253,251,250,0.5)', marginTop: 6 }}
          >
            Miembro · {memberSince}
          </div>

          <div className="perfil-stats">
            <div>
              <div className="perfil-stat-num italiana">{asistidos.length}</div>
              <div className="tag-label">Clases usadas</div>
            </div>
            <div>
              <div className="perfil-stat-num italiana">
                {activa ? activa.accesos : '—'}
              </div>
              <div className="tag-label">Plan</div>
            </div>
            <div>
              <div className="perfil-stat-num italiana">{restantes}</div>
              <div className="tag-label">Restan</div>
            </div>
          </div>

          <div className="perfil-brand">
            <img src={isoTaupe} alt="" className="perfil-brand-iso" />
            <span className="tag-label">CLIC studio pilates</span>
          </div>
        </div>

        <div className="perfil-side">
          <div className="card perfil-progress">
            <div className="perfil-progress-head">
              <div className="tag-label">Asistencia · últimos 5 meses</div>
              <div className="perfil-progress-pct italiana">
                {asistidos.length}
              </div>
            </div>
            <div className="perfil-bars">
              {progressByMonth.map((p, i) => (
                <div key={i} className="perfil-bar-col">
                  <div
                    className="perfil-bar"
                    style={{ height: `${Math.max(p.v, 0.08) * 100}%` }}
                  />
                  <div className="tag-label">{p.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card perfil-menu">
            {menu.map((m) => (
              <button
                key={m.label}
                className="perfil-menu-row"
                onClick={() => navigate(m.to)}
              >
                <span className="perfil-menu-icon">{m.icon}</span>
                <span>{m.label}</span>
                <span className="perfil-menu-arrow">→</span>
              </button>
            ))}
            {whatsappHref && sede && (
              <a
                className="perfil-menu-row"
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
              >
                <span className="perfil-menu-icon">✆</span>
                <span>WhatsApp {sede.nombre}</span>
                <span className="perfil-menu-arrow">↗</span>
              </a>
            )}
            <button
              className="perfil-menu-row danger"
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
            >
              <span className="perfil-menu-icon">↗</span>
              <span>Cerrar sesión</span>
              <span className="perfil-menu-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
