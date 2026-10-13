import { useCallback, useEffect, useMemo, useState } from 'react';
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

type Confirmacion =
  | { kind: 'reservar'; servicio: ServicioConsultorio; prestacion: Prestacion; hueco: HuecoConsultorio }
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

function ServicioCard({ servicio, onElegir }: { servicio: ServicioConsultorio; onElegir: (p: Prestacion, h: HuecoConsultorio) => void }) {
  const [prestacionId, setPrestacionId] = useState(servicio.prestaciones[0]?.id);
  const [abierto, setAbierto] = useState(false);
  const mesActual = servicio.meses[0];
  const mesSiguiente = servicio.meses[1];
  const prestacion = servicio.prestaciones.find((p) => p.id === prestacionId);
  const conParticulares = servicio.prestaciones.some((p) => p.precioParticular !== null);

  return (
    <div className="card consultorio-servicio">
      <div className="consultorio-servicio-head">
        <div>
          <div className="italiana consultorio-servicio-nombre">{servicio.nombre}</div>
          <div className="consultorio-meta">{servicio.sede.nombre}</div>
        </div>
        {servicio.incluidasPorMes > 0 && mesActual && (
          <span className={'badge ' + (mesActual.disponibles > 0 ? 'ok' : 'fu')}>
            {mesActual.disponibles > 0
              ? `Te queda ${mesActual.disponibles === 1 ? '1 consulta incluida' : `${mesActual.disponibles} incluidas`} en ${mesActual.mes}`
              : `Ya usaste la de ${mesActual.mes}`}
          </span>
        )}
      </div>

      {servicio.incluidasPorMes === 0 && !conParticulares ? (
        <p className="consultorio-nota">Tu plan no incluye consultas de {servicio.nombre.toLowerCase()}. Consultá en recepción.</p>
      ) : (
        <>
          {mesActual?.disponibles === 0 && mesSiguiente && mesSiguiente.disponibles > 0 && (
            <p className="consultorio-nota">Podés sacar la de {mesSiguiente.mes} eligiendo un día de ese mes.</p>
          )}
          {servicio.prestaciones.length > 1 && (
            <div className="consultorio-prestaciones">
              {servicio.prestaciones.map((p) => (
                <button
                  key={p.id}
                  className={'consultorio-prestacion' + (p.id === prestacionId ? ' active' : '')}
                  onClick={() => setPrestacionId(p.id)}
                >
                  {p.nombre} · {p.duracionMinutos} min
                  {p.precioParticular !== null && servicio.incluidasPorMes === 0 ? ` · ${formatARS(p.precioParticular)}` : ''}
                </button>
              ))}
            </div>
          )}
          {prestacion?.descripcion && <p className="consultorio-nota consultorio-descripcion">{prestacion.descripcion}</p>}
          {abierto && prestacion ? (
            <ElegirHorario
              sedeId={servicio.sede.id}
              prestacionId={prestacion.id}
              diasAdelante={servicio.diasReservaAnticipada}
              sena={prestacion.sena}
              onElegir={(h) => onElegir(prestacion, h)}
            />
          ) : (
            <button className="btn-taupe" onClick={() => setAbierto(true)}>
              Sacar una cita
            </button>
          )}
          <p className="consultorio-nota subtle">
            Podés cancelar o cambiar la cita hasta {servicio.horasCancelacion} h antes.
            {conParticulares &&
              ' Los horarios particulares se pagan aparte: una seña online a Clic y el resto al profesional el día de la consulta.'}
          </p>
        </>
      )}
    </div>
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
  // Cambia después de cada reserva/cambio/cancelación: remonta las tarjetas para
  // que el selector no quede mostrando horarios viejos (p. ej. incluidas ya usadas).
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

  const vuelta = useVueltaDeSena(cargar);
  const [cartelCerrado, setCartelCerrado] = useState(false);

  const servicioDeCita = (c: CitaConsultorio) => servicios?.find((s) => s.prestaciones.some((p) => p.id === c.prestacion.id));

  async function confirmar() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.kind === 'reservar' && confirm.hueco.modalidad === 'PARTICULAR') {
        const volverA = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/consultorio`;
        const r = await iniciarSena({ prestacionId: confirm.prestacion.id, franjaId: confirm.hueco.franjaId, inicio: confirm.hueco.inicio, volverA });
        if ('initPoint' in r) {
          guardarSenaEnCurso(r.solicitudId);
          window.location.assign(r.initPoint);
          return; // queda "Enviando…" hasta que carga MP
        }
        toast.success('¡Listo! Tu cita quedó confirmada. Te mandamos un mail.');
      } else if (confirm.kind === 'reservar') {
        await reservarCita({ prestacionId: confirm.prestacion.id, franjaId: confirm.hueco.franjaId, inicio: confirm.hueco.inicio });
        toast.success('¡Listo! Tu cita quedó confirmada. Te mandamos un mail.');
      } else if (confirm.kind === 'reprogramar') {
        await reprogramarCita({ citaId: confirm.cita.id, franjaId: confirm.hueco.franjaId, inicio: confirm.hueco.inicio });
        toast.success('Cita reprogramada');
        setReprogramando(null);
      } else {
        await cancelarCita(confirm.cita.id);
        toast.success('Cita cancelada');
      }
      setConfirm(null);
      await cargar();
      setVersion((v) => v + 1);
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

      <section className="consultorio-section">
        <div className="tag-label">Sacar una cita</div>
        {servicios.length === 0 ? (
          <div className="card agenda-empty">Tu plan no incluye servicios de consultorio.</div>
        ) : (
          servicios.map((s) => (
            <ServicioCard
              key={`${s.servicioId}-${s.sede.id}-${version}`}
              servicio={s}
              onElegir={(prestacion, hueco) => setConfirm({ kind: 'reservar', servicio: s, prestacion, hueco })}
            />
          ))
        )}
      </section>

      {confirm && (
        <div className="modal-backdrop" onClick={() => !busy && setConfirm(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="tag-label">
              {confirm.kind === 'reservar' ? 'Confirmar cita' : confirm.kind === 'reprogramar' ? 'Cambiar horario' : 'Cancelar cita'}
            </div>
            <div className="italiana modal-title">
              {confirm.kind === 'reservar'
                ? `${confirm.servicio.nombre} · ${confirm.prestacion.nombre}`
                : `${confirm.cita.servicio} · ${confirm.cita.prestacion.nombre}`}
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
                <div className="modal-meta">{confirm.kind === 'reservar' ? confirm.servicio.sede.nombre : confirm.cita.sede.nombre}</div>
                {confirm.kind === 'reservar' && confirm.prestacion.descripcion && (
                  <div className="modal-meta consultorio-descripcion">{confirm.prestacion.descripcion}</div>
                )}
                {confirm.kind === 'reservar' && confirm.hueco.modalidad === 'PARTICULAR' && confirm.prestacion.precioParticular !== null && (
                  <div className="modal-wait">
                    Consulta particular de {formatARS(confirm.prestacion.precioParticular)}.
                    {confirm.prestacion.sena > 0
                      ? ` Ahora pagás la seña de ${formatARS(confirm.prestacion.sena)} con Mercado Pago y el resto (${formatARS(confirm.prestacion.precioParticular - confirm.prestacion.sena)}) se lo pagás al profesional el día de la consulta. Te guardamos el horario 15 minutos. La seña no se devuelve: si cancelás la perdés; si cambiás el horario, la conservás.`
                      : ' Se la pagás al profesional el día de la consulta.'}
                  </div>
                )}
              </>
            )}
            <div className="modal-actions">
              <button className="modal-secondary" onClick={() => setConfirm(null)} disabled={busy}>
                Volver
              </button>
              <button className="btn-taupe" onClick={confirmar} disabled={busy}>
                {busy
                  ? 'Enviando…'
                  : confirm.kind === 'cancelar'
                    ? 'Cancelar cita'
                    : confirm.kind === 'reservar' && confirm.hueco.modalidad === 'PARTICULAR' && confirm.prestacion.sena > 0
                      ? `Pagar seña ${formatARS(confirm.prestacion.sena)}`
                      : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
