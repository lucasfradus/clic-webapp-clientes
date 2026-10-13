import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  cancelarCita,
  getCitas,
  getHuecos,
  getServiciosConsultorio,
  reprogramarCita,
  reservarCita,
} from '../api/consultorio';
import { ApiError } from '../api/client';
import { toast } from '../store/toast';
import type { CitaConsultorio, HuecoConsultorio, ServicioConsultorio } from '../types';
import { diasReservables, fechaLargaAR, horaAR, partesDia, puedeModificar, ymdAR } from '../lib/consultorio';
import './Agenda.css';
import './Consultorio.css';

type Confirmacion =
  | { kind: 'reservar'; servicio: ServicioConsultorio; prestacionId: number; hueco: HuecoConsultorio }
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
  onElegir,
}: {
  sedeId: number;
  prestacionId: number;
  diasAdelante: number;
  citaId?: number;
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
      ) : huecos.length === 0 ? (
        <div className="consultorio-empty">No hay horarios libres este día.</div>
      ) : (
        <div className="consultorio-huecos">
          {huecos.map((h) => (
            <button key={`${h.franjaId}-${h.inicio}`} className="consultorio-hueco" onClick={() => onElegir(h)}>
              <span className="italiana consultorio-hueco-hora">{horaAR(h.inicio)}</span>
              <span className="consultorio-hueco-profe">{h.profesional}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ServicioCard({ servicio, onElegir }: { servicio: ServicioConsultorio; onElegir: (prestacionId: number, h: HuecoConsultorio) => void }) {
  const [prestacionId, setPrestacionId] = useState(servicio.prestaciones[0]?.id);
  const [abierto, setAbierto] = useState(false);
  const mesActual = servicio.meses[0];
  const mesSiguiente = servicio.meses[1];

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

      {servicio.incluidasPorMes === 0 ? (
        <p className="consultorio-nota">Tu plan no incluye consultas de {servicio.nombre.toLowerCase()}. Las consultas particulares se reservan en recepción.</p>
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
                </button>
              ))}
            </div>
          )}
          {abierto && prestacionId ? (
            <ElegirHorario
              sedeId={servicio.sede.id}
              prestacionId={prestacionId}
              diasAdelante={servicio.diasReservaAnticipada}
              onElegir={(h) => onElegir(prestacionId, h)}
            />
          ) : (
            <button className="btn-taupe" onClick={() => setAbierto(true)}>
              Sacar una cita
            </button>
          )}
          <p className="consultorio-nota subtle">
            Podés cancelar o cambiar la cita hasta {servicio.horasCancelacion} h antes. Las consultas particulares se reservan en recepción.
          </p>
        </>
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

  const servicioDeCita = (c: CitaConsultorio) => servicios?.find((s) => s.prestaciones.some((p) => p.id === c.prestacion.id));

  async function confirmar() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.kind === 'reservar') {
        await reservarCita({ prestacionId: confirm.prestacionId, franjaId: confirm.hueco.franjaId, inicio: confirm.hueco.inicio });
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
              onElegir={(prestacionId, hueco) => setConfirm({ kind: 'reservar', servicio: s, prestacionId, hueco })}
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
                ? `${confirm.servicio.nombre} · ${confirm.servicio.prestaciones.find((p) => p.id === confirm.prestacionId)?.nombre ?? ''}`
                : `${confirm.cita.servicio} · ${confirm.cita.prestacion.nombre}`}
            </div>
            {confirm.kind === 'cancelar' ? (
              <>
                <div className="modal-meta">{fechaLargaAR(confirm.cita.inicio)} · {horaAR(confirm.cita.inicio)}</div>
                <div className="modal-meta">{confirm.cita.profesional}</div>
                <div className="modal-wait">El horario queda libre y, si era tu consulta incluida, la recuperás para ese mes.</div>
              </>
            ) : (
              <>
                <div className="modal-meta">{fechaLargaAR(confirm.hueco.inicio)} · {horaAR(confirm.hueco.inicio)}</div>
                <div className="modal-meta">{confirm.hueco.profesional}</div>
                <div className="modal-meta">{confirm.kind === 'reservar' ? confirm.servicio.sede.nombre : confirm.cita.sede.nombre}</div>
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
