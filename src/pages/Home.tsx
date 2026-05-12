import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Watermark from '../components/brand/Watermark';
import { useAuth } from '../store/auth';
import { useSelectedSede } from '../store/sede';
import { useBrand } from '../brand/context';
import { getSuscripciones } from '../api/suscripciones';
import { getTurnos } from '../api/turnos';
import type { Suscripcion, Turno } from '../types';
import {
  greeting,
  formatTime,
  formatDate,
  durationMinutes,
} from '../lib/date';
import { ApiError } from '../api/client';
import { toast } from '../store/toast';
import './Home.css';

export default function Home() {
  const perfil = useAuth((s) => s.perfil);
  const selectedSede = useSelectedSede();
  const navigate = useNavigate();
  const brand = useBrand();
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [historial, setHistorial] = useState<Turno[]>([]);
  const [cancelados, setCancelados] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subs, t, hist, canc] = await Promise.all([
        getSuscripciones(),
        getTurnos('proximos'),
        getTurnos('historial'),
        getTurnos('cancelados'),
      ]);
      setSuscripciones(subs);
      setTurnos(t);
      setHistorial(hist);
      setCancelados(canc);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const sedeId = selectedSede?.id;
  // Sub que aplica a la sede seleccionada: local primero, multisede como fallback.
  const active = useMemo(() => {
    const activas = suscripciones.filter((s) => s.estado === 'ACTIVA');
    if (sedeId === undefined) return activas[0];
    return (
      activas.find((s) => s.sedeId === sedeId) ??
      activas.find((s) => s.accesoMultisede)
    );
  }, [suscripciones, sedeId]);
  const fallback = useMemo(
    () =>
      !active
        ? suscripciones.find((s) => sedeId === undefined || s.sedeId === sedeId) ??
          suscripciones[0]
        : null,
    [active, suscripciones, sedeId]
  );
  const turnosSede = useMemo(
    () => (sedeId === undefined ? turnos : turnos.filter((t) => t.sede.id === sedeId)),
    [turnos, sedeId]
  );
  const proxima = turnosSede.find((t) => t.estado === 'CONFIRMADA');
  const reservas = turnosSede
    .filter((t) => t.estado === 'CONFIRMADA')
    .slice(0, 5);
  const historialItems = useMemo(() => {
    const items =
      sedeId === undefined
        ? [...historial, ...cancelados]
        : [...historial, ...cancelados].filter((t) => t.sede.id === sedeId);
    return items
      .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime())
      .slice(0, 10);
  }, [historial, cancelados, sedeId]);

  return (
    <div className="page home">
      <header className="home-head">
        <div>
          <div className="tag-label">{greeting()}</div>
          <h1 className="page-title">
            <img src={brand.logos.isoBlack} alt="" className="home-iso" />
            {perfil?.nombre ?? ''}
          </h1>
        </div>
        <div className="home-date tag-label">
          {formatDate(new Date().toISOString(), "EEE d MMM")}
        </div>
      </header>

      {/* Hero: próxima clase */}
      {proxima ? (
        <Link to="/agenda" className="card-dark home-hero home-hero-link">
          <div
            className="tag-label"
            style={{ color: 'rgba(253,251,250,0.5)' }}
          >
            Tu próxima clase
          </div>
          <div className="home-hero-row">
            <div>
              <div className="home-hero-name italiana">{proxima.actividad}</div>
              {proxima.instructor && (
                <div className="home-hero-meta">{proxima.instructor}</div>
              )}
              <div className="home-hero-meta subtle">
                {proxima.sede.nombre} ·{' '}
                {durationMinutes(proxima.inicio, proxima.fin)} min
              </div>
            </div>
            <div className="home-hero-right">
              <div className="home-hero-time italiana">
                {formatTime(proxima.inicio)}
              </div>
              <div className="tag-label" style={{ color: 'var(--taupe)' }}>
                {formatDate(proxima.inicio)}
              </div>
            </div>
          </div>
          <Watermark color="white" size={220} opacity={0.07} />
        </Link>
      ) : (
        <button
          className="card home-empty"
          onClick={() => navigate('/agenda')}
        >
          <div className="tag-label">Tu próxima clase</div>
          <div className="home-empty-msg italiana">Reservá una clase →</div>
        </button>
      )}

      {/* Plan */}
      {active && (
        <>
          <div className="home-section-head">
            <div className="tag-label">Tu plan</div>
            <Link to="/cuenta" className="tag-label home-link">
              Ver todo →
            </Link>
          </div>
          <div className="home-stats">
            <div className="card stat">
              <div className="tag-label">Clases</div>
              <div className="stat-big italiana">
                {active.accesosUsados} / {active.accesos}
              </div>
              <div className="stat-sub">
                {Math.max(
                  0,
                  active.accesos + active.accesosExtra - active.accesosUsados
                )}{' '}
                restantes
              </div>
              <span className="badge ok" style={{ marginTop: 12 }}>
                {active.modalidad === 'HORARIO_FIJO' ? 'Horario fijo' : 'Pack'}
              </span>
            </div>
            <div className="card stat">
              <div className="tag-label">Cancelaciones</div>
              <div className="stat-big italiana">
                {active.cancelacionesUsadas} / {active.cancelaciones}
              </div>
              <div className="stat-sub">
                {Math.max(
                  0,
                  active.cancelaciones - active.cancelacionesUsadas
                )}{' '}
                restantes
              </div>
              <span className="badge tuya" style={{ marginTop: 12 }}>
                {active.plan}
              </span>
            </div>
          </div>
        </>
      )}

      {!active && fallback && (
        <div className="card home-plan-inactive">
          <div className="tag-label">Tu plan</div>
          <div className="italiana home-plan-name">{fallback.plan}</div>
          <span className="badge fu" style={{ marginTop: 10 }}>
            {fallback.estado}
          </span>
        </div>
      )}

      {/* Reservas */}
      {reservas.length > 0 && (
        <>
          <div className="home-section-head">
            <div className="tag-label">Mis reservas</div>
            <Link to="/agenda" className="tag-label home-link">
              Ver todas →
            </Link>
          </div>
          <div className="card home-reservas">
            {reservas.map((r) => (
              <div key={r.reservaId} className="home-reserva-row">
                <div className="home-reserva-time italiana">
                  {formatTime(r.inicio)}
                </div>
                <div className="home-reserva-body">
                  <div className="home-reserva-title italiana">
                    {r.actividad}
                  </div>
                  <div className="home-reserva-meta">
                    {formatDate(r.inicio)}
                    {r.instructor ? ' · ' + r.instructor : ''}
                  </div>
                </div>
                <span className="badge ok">Confirmada</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Historial */}
      {(historial.length > 0 || cancelados.length > 0) && (<>
      <div className="home-section-head">
        <div className="tag-label">Historial</div>
      </div>
      <div className="card home-reservas">
        {historialItems.map((r) => (
            <div key={r.reservaId} className="home-reserva-row">
              <div className="home-reserva-time italiana">
                {formatTime(r.inicio)}
              </div>
              <div className="home-reserva-body">
                <div className="home-reserva-title italiana">
                  {r.actividad}
                </div>
                <div className="home-reserva-meta">
                  {formatDate(r.inicio)}
                  {r.instructor ? ' · ' + r.instructor : ''}
                </div>
              </div>
              {r.estado === 'ASISTIO' && <span className="badge ok">Asistió</span>}
              {r.estado === 'AUSENTE' && <span className="badge lw">Ausente</span>}
              {r.estado === 'CANCELADA_ALUMNO' && <span className="badge fu">Canceló alumno</span>}
              {r.estado === 'CANCELADA_SEDE' && <span className="badge lw">Canceló sede</span>}
            </div>
          ))}
      </div>
      </>)}

      {!loading && !active && !fallback && reservas.length === 0 && (
        <div className="card home-quote">
          <Watermark color="accent" size={32} inline />
          <div>
            <div className="italiana home-quote-text">
              Tu pilates empieza acá.
            </div>
            <div className="tag-label">Consultá con tu sede</div>
          </div>
        </div>
      )}
    </div>
  );
}
