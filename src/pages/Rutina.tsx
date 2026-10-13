import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { getMusculacion } from '../api/musculacion';
import { useAuth } from '../store/auth';
import VideoEjercicio from '../components/musculacion/VideoEjercicio';
import { diaMes, indicaciones, kg } from '../lib/musculacion';
import type { MusculacionEstado } from '../types';
import './Rutina.css';

type Status = 'loading' | 'ok' | 'error';

export default function Rutina() {
  const perfil = useAuth((s) => s.perfil);
  const [estado, setEstado] = useState<MusculacionEstado | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [diaKey, setDiaKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const res = await getMusculacion();
      setEstado(res);
      setDiaKey((actual) => (actual && res.rutina?.dias.some((d) => d.key === actual) ? actual : res.diaSugeridoKey));
      setStatus('ok');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error inesperado');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (perfil && !perfil.musculacionDisponible) return <Navigate to="/" replace />;

  const rutina = estado?.rutina ?? null;
  const diaIndex = rutina ? Math.max(0, rutina.dias.findIndex((d) => d.key === diaKey)) : 0;
  const dia = rutina?.dias[diaIndex];
  // Lo entrenado hoy de cada día de esta rutina, para marcar los chips y el botón.
  const deHoy = (key: string) =>
    estado?.entrenamientos.find((e) => e.asignacionId === rutina?.id && e.diaKey === key && e.fecha === estado.hoy);
  const registroDia = dia ? deHoy(dia.key) : undefined;
  const terminadoHoy = !!registroDia && registroDia.completados.length >= registroDia.bloques.length;

  return (
    <div className="page rutina">
      <header>
        <div className="tag-label">Musculación</div>
        <h1 className="page-title">Mi rutina</h1>
        {rutina && <div className="rutina-nombre italiana">{rutina.nombre}</div>}
      </header>

      {status === 'loading' && !estado && <div className="card rutina-msg">Cargando tu rutina…</div>}

      {status === 'error' && (
        <div className="card rutina-msg">
          <p>{error}</p>
          <button className="btn-taupe" onClick={load}>Reintentar</button>
        </div>
      )}

      {status === 'ok' && !rutina && (
        <div className="card-dark rutina-vacia">
          <div className="tag-label" style={{ color: 'rgba(253,251,250,0.5)' }}>Todavía no hay rutina</div>
          <p className="italiana rutina-vacia-titulo">Tu profe todavía no te asignó una rutina.</p>
          <p className="rutina-vacia-sub">Cuando la cargue, la vas a ver acá con los videos de cada ejercicio.</p>
        </div>
      )}

      {rutina && dia && (
        <>
          <div className="rutina-dias" role="tablist" aria-label="Días de la rutina">
            {rutina.dias.map((d, i) => {
              const hoy = deHoy(d.key);
              return (
                <button
                  key={d.key}
                  type="button"
                  role="tab"
                  aria-selected={d.key === dia.key}
                  className={'rutina-dia' + (d.key === dia.key ? ' active' : '')}
                  onClick={() => setDiaKey(d.key)}
                >
                  Día {i + 1}
                  {hoy && <span className="rutina-dia-hoy">{hoy.completados.length >= hoy.bloques.length ? 'Hecho hoy' : 'En curso'}</span>}
                </button>
              );
            })}
          </div>

          {dia.bloques.map((b, bi) => (
            <section key={b.key} className="card rutina-bloque">
              <div className="rutina-bloque-head">
                <div className="tag-label">Bloque {bi + 1}</div>
                <h2 className="rutina-bloque-nombre">{b.nombre}</h2>
                <div className="rutina-bloque-meta">
                  {b.vueltas} {b.vueltas === 1 ? 'vuelta' : 'vueltas'} · {b.ejercicios.length} {b.ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}
                </div>
              </div>
              <ol className="rutina-ejercicios">
                {b.ejercicios.map((e, ei) => {
                  const anterior = estado?.pesosAnteriores[e.ejercicioId];
                  const detalle = indicaciones(e);
                  return (
                    <li key={`${ei}-${e.ejercicioId}`} className="rutina-ejercicio">
                      <div className="rutina-ejercicio-fila">
                        <span className="rutina-ejercicio-num">{ei + 1}</span>
                        <div className="rutina-ejercicio-texto">
                          <div className="rutina-ejercicio-nombre">{e.nombre}</div>
                          {detalle && <div className="rutina-ejercicio-ind">{detalle}</div>}
                          {(e.cargaKg !== null || anterior) && (
                            <div className="rutina-ejercicio-pesos">
                              {e.cargaKg !== null && <span>Sugerido {kg(e.cargaKg)}</span>}
                              {anterior && <span>La vez pasada {kg(anterior.kg)} ({diaMes(anterior.fecha)})</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <VideoEjercicio url={e.videoUrl} nombre={e.nombre} />
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}

          <div className="rutina-cta">
            <Link to={`/rutina/entrenar/${dia.key}`} className="btn-taupe rutina-cta-btn">
              {terminadoHoy ? `Ver el Día ${diaIndex + 1} de hoy` : registroDia ? `Seguir con el Día ${diaIndex + 1}` : `Empezar Día ${diaIndex + 1}`}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
