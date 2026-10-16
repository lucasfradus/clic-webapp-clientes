import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  cancelarCita,
  getCitas,
  getEstadoSena,
  getHuecos,
  getServiciosConsultorio,
  iniciarSena,
  reprogramarCita,
  reservarCita,
} from '../api/consultorio';
import { ApiError } from '../api/client';
import { toast } from '../store/toast';
import type { CitaConsultorio, EstadoSena, HuecoConsultorio, ServicioConsultorio } from '../types';
import {
  diasReservables,
  fechaLargaAR,
  guardarSenaEnCurso,
  horaAR,
  olvidarSenaEnCurso,
  partesDia,
  puedeModificar,
  senaDeLaVuelta,
  ymdAR,
} from '../lib/consultorio';
import { formatARS } from '../lib/date';
import './Agenda.css';
import './Consultorio.css';

type Prestacion = ServicioConsultorio['prestaciones'][number];

/** Lo que se confirma en el modal: cambios sobre una cita ya sacada (una nueva se confirma en el paso 4). */
type Confirmacion =
  | { kind: 'reprogramar'; cita: CitaConsultorio; hueco: HuecoConsultorio }
  | { kind: 'cancelar'; cita: CitaConsultorio };

function mensajeError(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Error inesperado';
}

/** Selector de día + horarios libres. Lo usan "sacar una cita" y "reprogramar". */
function ElegirHorario({
  sedeId,
  prestacionId,
  diasAdelante,
  citaId,
  modalidad,
  sena,
  onElegir,
}: {
  sedeId: number;
  prestacionId: number;
  diasAdelante: number;
  citaId?: number;
  /** Al reprogramar: una incluida solo pasa a otra incluida y una particular a otra particular. */
  modalidad?: HuecoConsultorio['modalidad'];
  /** Seña de los horarios particulares (para mostrarla en el botón). */
  sena?: number;
  onElegir: (h: HuecoConsultorio) => void;
}) {
  const dias = useMemo(() => diasReservables(ymdAR(new Date()), diasAdelante), [diasAdelante]);
  const [desde, setDesde] = useState(0);
  const [dia, setDia] = useState(dias[0]);
  const [huecos, setHuecos] = useState<HuecoConsultorio[] | null>(null);

  useEffect(() => {
    let vigente = true;
    setHuecos(null);
    getHuecos({ sedeId, prestacionId, fecha: dia, citaId })
      .then((h) => vigente && setHuecos(h))
      .catch((err) => {
        if (vigente) setHuecos([]);
        toast.error(mensajeError(err));
      });
    return () => {
      vigente = false;
    };
  }, [sedeId, prestacionId, dia, citaId]);

  const visibles = dias.slice(desde, desde + 7);

  return (
    <div className="consultorio-picker">
      <div className="week-nav">
        <button className="week-nav-btn" disabled={desde === 0} onClick={() => setDesde(Math.max(0, desde - 7))}>
          ←
        </button>
        <div className="week-strip">
          {visibles.map((d) => {
            const p = partesDia(d);
            return (
              <button key={d} onClick={() => setDia(d)} className={'week-day' + (d === dia ? ' active' : '')}>
                <div className="week-day-letter">{p.letra}</div>
                <div className="week-day-num italiana">{p.numero}</div>
              </button>
            );
          })}
        </div>
        <button className="week-nav-btn" disabled={desde + 7 >= dias.length} onClick={() => setDesde(desde + 7)}>
          →
        </button>
      </div>

      {huecos === null ? (
        <div className="consultorio-empty">Buscando horarios…</div>
      ) : huecos.filter((h) => !modalidad || h.modalidad === modalidad).length === 0 ? (
        <div className="consultorio-empty">No hay horarios libres este día.</div>
      ) : (
        <div className="consultorio-huecos">
          {huecos
            .filter((h) => !modalidad || h.modalidad === modalidad)
            .map((h) => (
              <button key={`${h.franjaId}-${h.inicio}`} className="consultorio-hueco" onClick={() => onElegir(h)}>
                <span className="italiana consultorio-hueco-hora">{horaAR(h.inicio)}</span>
                <span className="consultorio-hueco-profe">{h.profesional}</span>
                <span className={'consultorio-hueco-tipo' + (h.modalidad === 'PARTICULAR' ? ' particular' : '')}>
                  {h.modalidad === 'INCLUIDA' ? 'Incluida' : sena ? `Particular · seña ${formatARS(sena)}` : 'Particular'}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

const claveServicio = (s: ServicioConsultorio) => `${s.servicioId}-${s.sede.id}`;

/**
 * Cómo se puede sacar la prestación: incluida en el plan (queda alguna este mes o
 * el que viene, y la prestación entra en el abono) y/o particular.
 */
function modalidades(servicio: ServicioConsultorio, prestacion: Prestacion) {
  return {
    incluida: prestacion.incluidaEnAbono !== false && servicio.incluidasPorMes > 0 && servicio.meses.some((m) => m.disponibles > 0),
    particular: prestacion.precioParticular !== null,
  };
}

function textoParticular(p: Prestacion): string {
  if (p.precioParticular === null) return '';
  return p.sena > 0 ? `Particular ${formatARS(p.precioParticular)} · seña ${formatARS(p.sena)}` : `Particular ${formatARS(p.precioParticular)}`;
}

const TITULOS = ['¿Qué servicio?', '¿Qué consulta?', '¿Cuándo?', 'Confirmar'];

/**
 * Sacar una cita, en cuatro pasos: servicio → prestación → horario → confirmar.
 * El paso sale de lo elegido: si al recargar la prestación deja de estar disponible
 * (p. ej. se usó la incluida), vuelve solo al paso 2.
 */
function SacarCita({ servicios, version, onReservada }: { servicios: ServicioConsultorio[]; version: number; onReservada: () => Promise<void> }) {
  const [clave, setClave] = useState<string | null>(null);
  const [prestacionId, setPrestacionId] = useState<number | null>(null);
  const [hueco, setHueco] = useState<HuecoConsultorio | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLElement>(null);

  const servicio = servicios.find((s) => claveServicio(s) === clave);
  const prestacion = servicio?.prestaciones.find((p) => p.id === prestacionId);
  const mods = servicio && prestacion ? modalidades(servicio, prestacion) : null;
  const paso = !servicio
    ? 1
    : !prestacion || !mods || (!mods.incluida && !mods.particular)
      ? 2
      : !hueco || !(hueco.modalidad === 'INCLUIDA' ? mods.incluida : mods.particular)
        ? 3
        : 4;

  // En el celular la lista puede quedar arriba de la pantalla: al cambiar de paso, volver al título.
  const primerRender = useRef(true);
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    const el = ref.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [paso]);

  function elegirServicio(s: ServicioConsultorio) {
    setClave(claveServicio(s));
    setPrestacionId(null);
    setHueco(null);
  }

  function elegirPrestacion(p: Prestacion) {
    setPrestacionId(p.id);
    setHueco(null);
  }

  function volver() {
    if (paso === 4) setHueco(null);
    else if (paso === 3) setPrestacionId(null);
    else setClave(null);
  }

  function reiniciar() {
    setClave(null);
    setPrestacionId(null);
    setHueco(null);
  }

  async function confirmar() {
    if (!servicio || !prestacion || !hueco) return;
    setBusy(true);
    try {
      if (hueco.modalidad === 'PARTICULAR') {
        const volverA = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/consultorio`;
        const r = await iniciarSena({ prestacionId: prestacion.id, franjaId: hueco.franjaId, inicio: hueco.inicio, volverA });
        if ('initPoint' in r) {
          guardarSenaEnCurso(r.solicitudId);
          window.location.assign(r.initPoint);
          return; // queda "Enviando…" hasta que carga MP
        }
      } else {
        await reservarCita({ prestacionId: prestacion.id, franjaId: hueco.franjaId, inicio: hueco.inicio });
      }
      toast.success('¡Listo! Tu cita quedó confirmada. Te mandamos un mail.');
      reiniciar();
      await onReservada();
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setBusy(false);
    }
  }

  if (servicios.length === 0) {
    return (
      <section className="consultorio-section">
        <div className="tag-label">Sacar una cita</div>
        <div className="card agenda-empty">Tu plan no incluye servicios de consultorio.</div>
      </section>
    );
  }

  const mesActual = servicio?.meses[0];
  const mesSiguiente = servicio?.meses[1];

  return (
    <section className="consultorio-section consultorio-pasos" ref={ref}>
      <div className="consultorio-pasos-head">
        <div className="tag-label">Sacar una cita</div>
        <div className="consultorio-paso-num">Paso {paso} de 4</div>
      </div>
      <div className="consultorio-progreso" aria-hidden>
        {TITULOS.map((t, i) => (
          <span key={t} className={i < paso ? 'hecho' : ''} />
        ))}
      </div>
      <div className="consultorio-paso-titulo">
        {paso > 1 && (
          <button className="consultorio-volver" onClick={volver} disabled={busy}>
            ← Volver
          </button>
        )}
        <h2 className="italiana">{TITULOS[paso - 1]}</h2>
      </div>
      {servicio && (
        <div className="consultorio-resumen">
          {[servicio.nombre, paso > 2 && prestacion?.nombre, paso > 2 && prestacion && `${prestacion.duracionMinutos} min`]
            .filter(Boolean)
            .join(' · ')}
          {' · '}
          <button className="consultorio-link" onClick={reiniciar} disabled={busy}>
            cambiar
          </button>
        </div>
      )}

      {paso === 1 &&
        servicios.map((s) => {
          const mes = s.meses[0];
          const sinNada = s.incluidasPorMes === 0 && !s.prestaciones.some((p) => p.precioParticular !== null);
          return (
            <button key={claveServicio(s)} className="card consultorio-opcion" disabled={sinNada} onClick={() => elegirServicio(s)}>
              <div className="consultorio-opcion-head">
                <div>
                  <div className="italiana consultorio-servicio-nombre">{s.nombre}</div>
                  <div className="consultorio-meta">{s.sede.nombre}</div>
                </div>
                {!sinNada && <span className="consultorio-flecha">→</span>}
              </div>
              {sinNada ? (
                <p className="consultorio-nota">Tu plan no incluye consultas de {s.nombre.toLowerCase()}. Consultá en recepción.</p>
              ) : (
                s.incluidasPorMes > 0 &&
                mes && (
                  <div className="consultorio-tags">
                    <span className={'badge ' + (mes.disponibles > 0 ? 'ok' : 'fu')}>
                      {mes.disponibles > 0
                        ? `Te queda ${mes.disponibles === 1 ? '1 consulta incluida' : `${mes.disponibles} incluidas`} en ${mes.mes}`
                        : `Ya usaste la de ${mes.mes}`}
                    </span>
                  </div>
                )
              )}
            </button>
          );
        })}

      {paso === 2 && servicio && (
        <>
          {servicio.prestaciones.map((p) => {
            const m = modalidades(servicio, p);
            const disponible = m.incluida || m.particular;
            return (
              <button key={p.id} className="card consultorio-opcion" disabled={!disponible} onClick={() => elegirPrestacion(p)}>
                <div className="consultorio-opcion-head">
                  <div className="italiana consultorio-servicio-nombre">{p.nombre}</div>
                  <span className="consultorio-duracion">{p.duracionMinutos} min</span>
                </div>
                {p.descripcion && <p className="consultorio-nota consultorio-descripcion">{p.descripcion}</p>}
                <div className="consultorio-tags">
                  {m.incluida && <span className="badge ok">Incluida en tu plan</span>}
                  {m.particular && <span className="badge tuya">{textoParticular(p)}</span>}
                  {!disponible && <span className="badge fu">No disponible por ahora</span>}
                </div>
              </button>
            );
          })}
          {servicio.prestaciones.some((p) => p.precioParticular !== null) && (
            <p className="consultorio-nota subtle">
              Los horarios particulares se pagan aparte: una seña online a Clic y el resto al profesional el día de la consulta.
            </p>
          )}
        </>
      )}

      {paso === 3 && servicio && prestacion && (
        <div className="card">
          {mods?.incluida && mesActual?.disponibles === 0 && mesSiguiente && mesSiguiente.disponibles > 0 && (
            <p className="consultorio-nota consultorio-nota-picker">Podés sacar la de {mesSiguiente.mes} eligiendo un día de ese mes.</p>
          )}
          <ElegirHorario
            key={version}
            sedeId={servicio.sede.id}
            prestacionId={prestacion.id}
            diasAdelante={servicio.diasReservaAnticipada}
            sena={prestacion.sena}
            onElegir={setHueco}
          />
        </div>
      )}

      {paso === 4 && servicio && prestacion && hueco && (
        <div className="card consultorio-confirmar">
          <div className="italiana consultorio-servicio-nombre">
            {servicio.nombre} · {prestacion.nombre}
          </div>
          <div className="consultorio-confirmar-datos">
            <div className="consultorio-confirmar-fecha">{fechaLargaAR(hueco.inicio)}</div>
            <div className="italiana consultorio-confirmar-hora">
              {horaAR(hueco.inicio)} a {horaAR(hueco.fin)}
            </div>
            <div className="modal-meta">{hueco.profesional}</div>
            <div className="modal-meta">{servicio.sede.nombre}</div>
          </div>
          {hueco.modalidad === 'INCLUIDA' ? (
            <div className="consultorio-tags">
              <span className="badge ok">Incluida en tu plan</span>
            </div>
          ) : (
            prestacion.precioParticular !== null && (
              <div className="modal-wait">
                Consulta particular de {formatARS(prestacion.precioParticular)}.
                {prestacion.sena > 0
                  ? ` Ahora pagás la seña de ${formatARS(prestacion.sena)} con Mercado Pago y el resto (${formatARS(prestacion.precioParticular - prestacion.sena)}) se lo pagás al profesional el día de la consulta. Te guardamos el horario 15 minutos. La seña no se devuelve: si cancelás la perdés; si cambiás el horario, la conservás.`
                  : ' Se la pagás al profesional el día de la consulta.'}
              </div>
            )
          )}
          <p className="consultorio-nota subtle">Podés cancelar o cambiar la cita hasta {servicio.horasCancelacion} h antes.</p>
          <div className="modal-actions">
            <button className="modal-secondary" onClick={volver} disabled={busy}>
              Volver
            </button>
            <button className="btn-taupe" onClick={confirmar} disabled={busy}>
              {busy
                ? 'Enviando…'
                : hueco.modalidad === 'PARTICULAR' && prestacion.sena > 0
                  ? `Pagar seña ${formatARS(prestacion.sena)}`
                  : 'Confirmar'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/** Volviendo de MP: espera a que se acredite la seña (el webhook o el backend, que le pregunta a MP). */
function useVueltaDeSena(onConfirmada: () => void) {
  const location = useLocation();
  const navigate = useNavigate();
  const [solicitudId] = useState(() => senaDeLaVuelta(location.search));
  const [estado, setEstado] = useState<EstadoSena | null>(null);
  const [agotado, setAgotado] = useState(false);

  useEffect(() => {
    if (!solicitudId) return;
    let vigente = true;
    let intentos = 0;
    let timer: ReturnType<typeof setTimeout>;
    const consultar = async () => {
      try {
        const e = await getEstadoSena(solicitudId);
        if (!vigente) return;
        setEstado(e);
        if (e.estado !== 'PENDIENTE') {
          olvidarSenaEnCurso();
          // Saca los parámetros de MP de la URL: recargar no vuelve a mostrar el cartel.
          navigate('/consultorio', { replace: true });
          if (e.estado === 'PROCESADA') onConfirmada();
          return;
        }
      } catch {
        /* reintenta */
      }
      if (++intentos >= 20) setAgotado(true);
      else timer = setTimeout(consultar, 3000);
    };
    void consultar();
    return () => {
      vigente = false;
      clearTimeout(timer);
    };
  }, [solicitudId, navigate, onConfirmada]);

  return solicitudId ? { estado, agotado } : null;
}

function CartelSena({ vuelta, onCerrar }: { vuelta: { estado: EstadoSena | null; agotado: boolean }; onCerrar: () => void }) {
  const e = vuelta.estado?.estado;
  const texto =
    e === 'PROCESADA'
      ? '¡Listo! Recibimos la seña y tu cita quedó confirmada. Te mandamos un mail.'
      : e === 'SIN_LUGAR'
        ? 'Recibimos tu seña, pero el horario se ocupó mientras pagabas. Recepción te va a contactar para darte otro: la seña no se pierde.'
        : e === 'VENCIDA'
          ? 'No recibimos el pago de la seña a tiempo y el horario se liberó. Si te lo cobraron, avisá en recepción.'
          : vuelta.agotado
            ? 'Todavía no se acreditó el pago. Si te lo cobraron, en unos minutos la cita va a aparecer acá.'
            : 'Estamos confirmando el pago de la seña…';
  return (
    <div className={'card consultorio-cartel' + (e === 'PROCESADA' ? ' ok' : e === 'SIN_LUGAR' || e === 'VENCIDA' ? ' alerta' : '')}>
      <span>{texto}</span>
      {e && e !== 'PENDIENTE' && (
        <button className="modal-secondary" onClick={onCerrar}>
          Cerrar
        </button>
      )}
    </div>
  );
}

export default function Consultorio() {
  const [servicios, setServicios] = useState<ServicioConsultorio[] | null>(null);
  const [citas, setCitas] = useState<CitaConsultorio[]>([]);
  const [reprogramando, setReprogramando] = useState<CitaConsultorio | null>(null);
  const [confirm, setConfirm] = useState<Confirmacion | null>(null);
  const [busy, setBusy] = useState(false);
  // Cambia después de cada reserva/cambio/cancelación: remonta el selector de horarios
  // para que no quede mostrando huecos viejos (p. ej. incluidas ya usadas).
  const [version, setVersion] = useState(0);

  const cargar = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([getServiciosConsultorio(), getCitas('proximas')]);
      setServicios(s);
      setCitas(c);
    } catch (err) {
      toast.error(mensajeError(err));
      setServicios([]);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const recargar = useCallback(async () => {
    await cargar();
    setVersion((v) => v + 1);
  }, [cargar]);

  const vuelta = useVueltaDeSena(cargar);
  const [cartelCerrado, setCartelCerrado] = useState(false);

  const servicioDeCita = (c: CitaConsultorio) => servicios?.find((s) => s.prestaciones.some((p) => p.id === c.prestacion.id));

  async function confirmar() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.kind === 'reprogramar') {
        await reprogramarCita({ citaId: confirm.cita.id, franjaId: confirm.hueco.franjaId, inicio: confirm.hueco.inicio });
        toast.success('Cita reprogramada');
        setReprogramando(null);
      } else {
        await cancelarCita(confirm.cita.id);
        toast.success('Cita cancelada');
      }
      setConfirm(null);
      await recargar();
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setBusy(false);
    }
  }

  if (servicios === null) return <div className="page"><div className="full-loader">Cargando…</div></div>;

  return (
    <div className="page consultorio">
      <header className="agenda-head">
        <div>
          <div className="tag-label">Nutrición y más</div>
          <h1 className="page-title">Consultorio</h1>
        </div>
      </header>

      {vuelta && !cartelCerrado && <CartelSena vuelta={vuelta} onCerrar={() => setCartelCerrado(true)} />}

      {citas.length > 0 && (
        <section className="consultorio-section">
          <div className="tag-label">Tus citas</div>
          <div className="class-list">
            {citas.map((c) => {
              const modificable = puedeModificar(c.cancelableHasta);
              const servicio = servicioDeCita(c);
              return (
                <div key={c.id} className="class-row consultorio-cita">
                  <div className="class-time">
                    <div className="class-time-h italiana">{horaAR(c.inicio)}</div>
                    <div className="class-time-p">{partesDia(ymdAR(new Date(c.inicio))).numero} {partesDia(ymdAR(new Date(c.inicio))).mes}</div>
                  </div>
                  <div className="class-body">
                    <div className="class-name italiana">{c.servicio} · {c.prestacion.nombre}</div>
                    <div className="class-meta">{[c.profesional, c.sede.nombre, c.consultorio].filter(Boolean).join(' · ')}</div>
                    {c.modalidad === 'PARTICULAR' && c.precio !== null && (
                      <div className="class-meta">
                        {c.sena
                          ? `Seña pagada ${formatARS(c.sena)} · al profesional ${formatARS(c.precio - c.sena)}`
                          : `Particular · al profesional ${formatARS(c.precio)}`}
                      </div>
                    )}
                    {modificable ? (
                      <div className="consultorio-acciones">
                        {servicio && (
                          <button className="modal-secondary" onClick={() => setReprogramando(c)}>
                            Cambiar horario
                          </button>
                        )}
                        <button className="modal-secondary" onClick={() => setConfirm({ kind: 'cancelar', cita: c })}>
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="consultorio-nota subtle">
                        Ya no se puede cancelar ni cambiar ({servicio?.horasCancelacion ?? 4} h antes).
                      </div>
                    )}
                  </div>
                  <div className="class-status">
                    <span className="badge tuya">Confirmada</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {reprogramando && servicioDeCita(reprogramando) && (
        <section className="consultorio-section">
          <div className="consultorio-reprogramar-head">
            <div className="tag-label">Elegí el nuevo horario para {reprogramando.prestacion.nombre}</div>
            <button className="modal-secondary" onClick={() => setReprogramando(null)}>
              Volver
            </button>
          </div>
          <div className="card">
            <ElegirHorario
              sedeId={reprogramando.sede.id}
              prestacionId={reprogramando.prestacion.id}
              diasAdelante={servicioDeCita(reprogramando)!.diasReservaAnticipada}
              citaId={reprogramando.id}
              modalidad={reprogramando.modalidad}
              onElegir={(h) => setConfirm({ kind: 'reprogramar', cita: reprogramando, hueco: h })}
            />
          </div>
        </section>
      )}

      <SacarCita servicios={servicios} version={version} onReservada={recargar} />

      {confirm && (
        <div className="modal-backdrop" onClick={() => !busy && setConfirm(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="tag-label">{confirm.kind === 'reprogramar' ? 'Cambiar horario' : 'Cancelar cita'}</div>
            <div className="italiana modal-title">
              {confirm.cita.servicio} · {confirm.cita.prestacion.nombre}
            </div>
            {confirm.kind === 'cancelar' ? (
              <>
                <div className="modal-meta">{fechaLargaAR(confirm.cita.inicio)} · {horaAR(confirm.cita.inicio)}</div>
                <div className="modal-meta">{confirm.cita.profesional}</div>
                <div className="modal-wait">
                  {confirm.cita.modalidad === 'PARTICULAR'
                    ? 'El horario queda libre. La seña no se devuelve: si querés conservarla, cambiá el horario en lugar de cancelar.'
                    : 'El horario queda libre y, si era tu consulta incluida, la recuperás para ese mes.'}
                </div>
              </>
            ) : (
              <>
                <div className="modal-meta">{fechaLargaAR(confirm.hueco.inicio)} · {horaAR(confirm.hueco.inicio)}</div>
                <div className="modal-meta">{confirm.hueco.profesional}</div>
                <div className="modal-meta">{confirm.cita.sede.nombre}</div>
              </>
            )}
            <div className="modal-actions">
              <button className="modal-secondary" onClick={() => setConfirm(null)} disabled={busy}>
                Volver
              </button>
              <button className="btn-taupe" onClick={confirmar} disabled={busy}>
                {busy ? 'Enviando…' : confirm.kind === 'cancelar' ? 'Cancelar cita' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
