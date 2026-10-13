import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { getMusculacion, iniciarEntrenamiento, registrarBloque, registrarPeso } from '../api/musculacion';
import { useAuth } from '../store/auth';
import { toast } from '../store/toast';
import VideoEjercicio from '../components/musculacion/VideoEjercicio';
import { clavePeso, diaMes, indicaciones, kg, parsePeso } from '../lib/musculacion';
import { useWakeLock } from '../lib/useWakeLock';
import type { BloqueRutina, EntrenamientoMusculacion, MusculacionEstado } from '../types';
import './Entrenar.css';

type Carga = { estado: MusculacionEstado; registro: EntrenamientoMusculacion; diaNumero: number };
type Status = 'loading' | 'ok' | 'error' | 'no-existe';

/** Trae el entrenamiento de hoy para ese día; si todavía no existe, lo crea. */
async function cargar(diaKey: string): Promise<Carga | null> {
  let estado = await getMusculacion();
  const rutina = estado.rutina;
  const diaIndex = rutina ? rutina.dias.findIndex((d) => d.key === diaKey) : -1;
  if (!rutina || diaIndex === -1) return null;
  const deHoy = (e: MusculacionEstado) =>
    e.entrenamientos.find((x) => x.asignacionId === rutina.id && x.diaKey === diaKey && x.fecha === e.hoy);
  let registro = deHoy(estado);
  if (!registro) {
    await iniciarEntrenamiento(rutina.id, rutina.version, diaKey);
    estado = await getMusculacion();
    registro = deHoy(estado);
  }
  return registro ? { estado, registro, diaNumero: diaIndex + 1 } : null;
}

const textoPeso = (valor: number) => String(valor).replace('.', ',');

export default function Entrenar() {
  const { diaKey = '' } = useParams();
  const navigate = useNavigate();
  const perfil = useAuth((s) => s.perfil);
  const [carga, setCarga] = useState<Carga | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  // Bloque en pantalla; bloques.length = pantalla de cierre.
  const [actual, setActual] = useState(0);
  const [textos, setTextos] = useState<Record<string, string>>({});
  const version = useRef(0);
  const cola = useRef<Promise<void>>(Promise.resolve());
  useWakeLock();

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const c = await cargar(diaKey);
      if (!c) {
        setStatus('no-existe');
        return;
      }
      version.current = c.registro.version;
      setCarga(c);
      setTextos(Object.fromEntries(Object.entries(c.registro.pesos).map(([k, v]) => [k, textoPeso(v)])));
      const pendiente = c.registro.bloques.findIndex((b) => !c.registro.completados.includes(b.key));
      setActual(pendiente === -1 ? c.registro.bloques.length : pendiente);
      setStatus('ok');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error inesperado');
      setStatus('error');
    }
  }, [diaKey]);

  useEffect(() => {
    load();
  }, [load]);

  if (perfil && !perfil.musculacionDisponible) return <Navigate to="/" replace />;

  // Los cambios van en fila: cada PATCH necesita la versión que devolvió el anterior.
  // Un 409 (se modificó desde otro dispositivo) recarga para no pisar nada.
  function guardar(cambio: (v: number) => Promise<number>) {
    cola.current = cola.current.then(async () => {
      try {
        version.current = await cambio(version.current);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'No se pudo guardar. Revisá la conexión.');
        if (err instanceof ApiError && err.status === 409) await load();
      }
    });
  }

  function actualizar(fn: (r: EntrenamientoMusculacion) => EntrenamientoMusculacion) {
    setCarga((c) => (c ? { ...c, registro: fn(c.registro) } : c));
  }

  function guardarPeso(bloqueKey: string, index: number) {
    if (!carga) return;
    const clave = clavePeso(bloqueKey, index);
    const valor = parsePeso(textos[clave] ?? '');
    const previo = carga.registro.pesos[clave] ?? null;
    if (valor === undefined) {
      toast.error('Ingresá el peso en kg, por ejemplo 12,5');
      setTextos((t) => ({ ...t, [clave]: previo === null ? '' : textoPeso(previo) }));
      return;
    }
    if (valor === previo) return;
    actualizar((r) => {
      const pesos = { ...r.pesos };
      if (valor === null) delete pesos[clave];
      else pesos[clave] = valor;
      return { ...r, pesos };
    });
    const id = carga.registro.id;
    guardar((v) => registrarPeso(id, v, bloqueKey, index, valor));
  }

  function marcarBloque(bloque: BloqueRutina, completado: boolean) {
    if (!carga) return;
    const { registro } = carga;
    const completados = completado
      ? [...new Set([...registro.completados, bloque.key])]
      : registro.completados.filter((k) => k !== bloque.key);
    actualizar((r) => ({ ...r, completados }));
    guardar((v) => registrarBloque(registro.id, v, bloque.key, completado));
    if (completado) {
      // Siguiente bloque sin terminar, o la pantalla de cierre si ya están todos.
      const siguiente = registro.bloques.findIndex((b, i) => i > actual && !completados.includes(b.key));
      const cualquiera = registro.bloques.findIndex((b) => !completados.includes(b.key));
      setActual(siguiente !== -1 ? siguiente : cualquiera !== -1 ? cualquiera : registro.bloques.length);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const salir = () => navigate('/rutina');

  if (status !== 'ok' || !carga) {
    return (
      <div className="entrenar entrenar-centro">
        <button type="button" className="entrenar-cerrar" onClick={salir} aria-label="Cerrar">✕</button>
        {status === 'loading' && <p className="entrenar-msg">Preparando tu entrenamiento…</p>}
        {status === 'no-existe' && (
          <div className="entrenar-msg">
            <p>Este día ya no está en tu rutina. Puede que tu profe la haya cambiado.</p>
            <button className="btn-taupe" onClick={salir}>Ver mi rutina</button>
          </div>
        )}
        {status === 'error' && (
          <div className="entrenar-msg">
            <p>{error}</p>
            <button className="btn-taupe" onClick={load}>Reintentar</button>
          </div>
        )}
      </div>
    );
  }

  const { registro, estado, diaNumero } = carga;
  const bloques = registro.bloques;
  const terminado = actual >= bloques.length;
  const bloque = bloques[actual];
  const hechos = registro.completados.length;

  return (
    <div className="entrenar">
      <header className="entrenar-head">
        <div className="entrenar-head-texto">
          <div className="tag-label">{registro.rutinaNombre}</div>
          <div className="entrenar-titulo">Día {diaNumero}</div>
        </div>
        <button type="button" className="entrenar-cerrar" onClick={salir} aria-label="Cerrar">✕</button>
        <div className="entrenar-progreso" aria-label={`${hechos} de ${bloques.length} bloques terminados`}>
          {bloques.map((b, i) => (
            <button
              key={b.key}
              type="button"
              className={'entrenar-punto' + (registro.completados.includes(b.key) ? ' hecho' : '') + (i === actual ? ' actual' : '')}
              onClick={() => setActual(i)}
              aria-label={`Ir al bloque ${i + 1}`}
            />
          ))}
        </div>
      </header>

      <main className="entrenar-cuerpo">
        {terminado ? (
          <section className="entrenar-fin">
            <div className="entrenar-fin-icono" aria-hidden="true">✓</div>
            <h1 className="page-title">¡Día {diaNumero} completado!</h1>
            <p className="entrenar-fin-sub">Buen trabajo. Esto es lo que anotaste hoy:</p>
            <ul className="entrenar-resumen">
              {bloques.flatMap((b) =>
                b.ejercicios.map((e, i) => {
                  const peso = registro.pesos[clavePeso(b.key, i)];
                  return (
                    <li key={clavePeso(b.key, i)}>
                      <span>{e.nombre}</span>
                      <span className="entrenar-resumen-kg">{peso !== undefined ? kg(peso) : '—'}</span>
                    </li>
                  );
                })
              )}
            </ul>
            <div className="entrenar-fin-acciones">
              <button className="btn-taupe" onClick={salir}>Volver a mi rutina</button>
              <button className="entrenar-link" onClick={() => setActual(0)}>Revisar los bloques</button>
            </div>
          </section>
        ) : (
          <>
            <div className="entrenar-bloque-head">
              <div className="tag-label">Bloque {actual + 1} de {bloques.length}</div>
              <h1 className="entrenar-bloque-nombre">{bloque.nombre}</h1>
              <div className="entrenar-bloque-meta">{bloque.vueltas} {bloque.vueltas === 1 ? 'vuelta' : 'vueltas'}</div>
            </div>

            {bloque.ejercicios.map((e, i) => {
              const clave = clavePeso(bloque.key, i);
              const anterior = estado.pesosAnteriores[e.ejercicioId];
              const detalle = indicaciones(e);
              return (
                <article key={clave} className="card entrenar-ejercicio">
                  <div className="entrenar-ejercicio-nombre">{i + 1}. {e.nombre}</div>
                  {detalle && <div className="entrenar-ejercicio-ind">{detalle}</div>}
                  <VideoEjercicio url={e.videoUrl} nombre={e.nombre} />
                  <div className="entrenar-peso">
                    <label className="entrenar-peso-label" htmlFor={`peso-${clave}`}>Peso de hoy</label>
                    <div className="entrenar-peso-input">
                      <input
                        id={`peso-${clave}`}
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder={anterior ? textoPeso(anterior.kg) : e.cargaKg !== null ? textoPeso(e.cargaKg) : '–'}
                        value={textos[clave] ?? ''}
                        onChange={(ev) => setTextos((t) => ({ ...t, [clave]: ev.target.value }))}
                        onBlur={() => guardarPeso(bloque.key, i)}
                        onKeyDown={(ev) => { if (ev.key === 'Enter') ev.currentTarget.blur(); }}
                      />
                      <span>kg</span>
                    </div>
                    <div className="entrenar-peso-ref">
                      {anterior ? `La vez pasada ${kg(anterior.kg)} (${diaMes(anterior.fecha)})` : e.cargaKg !== null ? `Sugerido ${kg(e.cargaKg)}` : 'Primera vez: anotá con cuánto lo hiciste'}
                    </div>
                  </div>
                </article>
              );
            })}
          </>
        )}
      </main>

      {!terminado && (
        <footer className="entrenar-acciones">
          <button type="button" className="entrenar-secundario" disabled={actual === 0} onClick={() => setActual(actual - 1)}>← Anterior</button>
          {registro.completados.includes(bloque.key) ? (
            <button type="button" className="entrenar-secundario" onClick={() => marcarBloque(bloque, false)}>Desmarcar bloque</button>
          ) : (
            <button type="button" className="btn-taupe entrenar-principal" onClick={() => marcarBloque(bloque, true)}>✓ Terminé el bloque</button>
          )}
          {registro.completados.includes(bloque.key) && (
            <button type="button" className="btn-taupe entrenar-principal" onClick={() => setActual(actual + 1)}>Siguiente →</button>
          )}
        </footer>
      )}
    </div>
  );
}
