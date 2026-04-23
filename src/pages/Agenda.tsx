import { useCallback, useEffect, useMemo, useState } from 'react';
import Watermark from '../components/brand/Watermark';
import { getClases } from '../api/clases';
import { getSuscripciones } from '../api/suscripciones';
import { getTurnos } from '../api/turnos';
import { getSede } from '../api/perfil';
import { getSedesAccesibles, getSalones } from '../api/sedes';
import { reservar, cancelarReserva } from '../api/reservas';
import type {
  Clase,
  Suscripcion,
  Turno,
  Sede,
  SedeAccesible,
  Salon,
} from '../types';
import {
  weekDays,
  sameDay,
  formatTime,
  durationMinutes,
  addDays,
  hoursUntil,
  formatDateLong,
} from '../lib/date';
import { ApiError } from '../api/client';
import { toast } from '../store/toast';
import './Agenda.css';

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function Agenda() {
  const [weekRef, setWeekRef] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());

  const [sedes, setSedes] = useState<SedeAccesible[]>([]);
  const [selectedSedeId, setSelectedSedeId] = useState<number | undefined>();
  const [salones, setSalones] = useState<Salon[]>([]);
  const [selectedSalonId, setSelectedSalonId] = useState<number | undefined>();

  const [clases, setClases] = useState<Clase[]>([]);
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [sedeHome, setSedeHome] = useState<Sede | null>(null);
  const [loading, setLoading] = useState(false);

  const [sedeDropdown, setSedeDropdown] = useState(false);
  const [salonDropdown, setSalonDropdown] = useState(false);

  const [confirm, setConfirm] = useState<
    | { kind: 'reservar'; clase: Clase }
    | { kind: 'cancelar'; clase: Clase; reservaId: number }
    | null
  >(null);
  const [busy, setBusy] = useState(false);

  const days = useMemo(() => weekDays(weekRef), [weekRef]);
  const activa = suscripciones.find((s) => s.estado === 'ACTIVA');
  const accesosRestantes = activa
    ? activa.accesos + activa.accesosExtra - activa.accesosUsados
    : 0;

  const selectedSede = sedes.find((s) => s.id === selectedSedeId);
  const isVisitor = selectedSede && !selectedSede.esHome;
  const showSedePill = sedes.length > 1;
  const showSalonPill = salones.length > 1;

  // 1. Load sedes accesibles + suscripciones + sede home (para tolerancia)
  useEffect(() => {
    getSedesAccesibles()
      .then((list) => {
        setSedes(list);
        const home = list.find((s) => s.esHome) ?? list[0];
        if (home) setSelectedSedeId(home.id);
      })
      .catch((e: ApiError) => toast.error(e.message));

    getSuscripciones()
      .then(setSuscripciones)
      .catch((e: ApiError) => toast.error(e.message));

    getSede()
      .then(setSedeHome)
      .catch(() => {});
  }, []);

  // 2. Load salones cuando cambia la sede
  useEffect(() => {
    if (selectedSedeId === undefined) return;
    getSalones(selectedSedeId)
      .then(setSalones)
      .catch((e: ApiError) => {
        toast.error(e.message);
        setSalones([]);
      });
  }, [selectedSedeId]);

  const loadSubs = useCallback(async () => {
    try {
      setSuscripciones(await getSuscripciones());
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }, []);

  // 3. Load clases cuando cambia sede, salón o semana
  const loadClases = useCallback(async () => {
    if (!activa || selectedSedeId === undefined) {
      setClases([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getClases({
        sedeId: selectedSedeId,
        salonId: selectedSalonId,
        desde: days[0].toISOString(),
        dias: 7,
      });
      setClases(data);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      setClases([]);
    } finally {
      setLoading(false);
    }
  }, [activa, selectedSedeId, selectedSalonId, days]);

  useEffect(() => {
    loadClases();
  }, [loadClases]);

  const clasesDelDia = useMemo(
    () =>
      clases
        .filter((c) => sameDay(c.inicio, selectedDay))
        .sort((a, b) => a.inicio.localeCompare(b.inicio)),
    [clases, selectedDay]
  );

  const reservadasDelDia = clasesDelDia.filter((c) => c.yaReservada).length;

  function handleSedeChange(newId: number) {
    setSelectedSedeId(newId);
    setSelectedSalonId(undefined);
    setSedeDropdown(false);
  }

  function handleSalonChange(newId: number | undefined) {
    setSelectedSalonId(newId);
    setSalonDropdown(false);
  }

  function isPast(c: Clase) {
    return (
      c.motivoNoDisponible === 'YA_COMENZO' ||
      new Date(c.inicio).getTime() <= Date.now()
    );
  }

  function statusBadge(c: Clase) {
    if (c.yaReservada) return <span className="badge tuya">Reservada</span>;
    if (isPast(c)) return <span className="badge fu">Ya comenzó</span>;
    if (c.motivoNoDisponible === 'FUERA_DE_VENTANA')
      return <span className="badge fu">No disponible</span>;
    if (c.motivoNoDisponible === 'SIN_ACCESOS')
      return <span className="badge lw">Sin accesos</span>;
    const libres = c.cupo - c.reservas;
    if (libres <= 0) return <span className="badge fu">Sin disponibilidad</span>;
    if (libres <= 3)
      return <span className="badge lw">Baja disponibilidad</span>;
    return <span className="badge ok">Disponible</span>;
  }

  function onClaseClick(c: Clase) {
    if (!c.yaReservada && isPast(c)) {
      toast.error('Esta clase ya comenzó, no podés reservarla');
      return;
    }
    if (c.yaReservada) {
      const tol = sedeHome?.toleranciaCancelacion ?? 2;
      if (activa && activa.cancelacionesUsadas >= activa.cancelaciones) {
        toast.error('Ya usaste todas tus cancelaciones del mes');
        return;
      }
      if (hoursUntil(c.inicio) < tol) {
        toast.error(
          `No podés cancelar con menos de ${tol} horas de anticipación`
        );
        return;
      }
      getTurnos('proximos')
        .then((turnos: Turno[]) => {
          const t = turnos.find(
            (x) => x.inicio === c.inicio && x.estado === 'CONFIRMADA'
          );
          if (!t) {
            toast.error('No se encontró la reserva');
            return;
          }
          setConfirm({ kind: 'cancelar', clase: c, reservaId: t.reservaId });
        })
        .catch((e: ApiError) => toast.error(e.message));
      return;
    }

    if (!activa || accesosRestantes <= 0) {
      toast.error('No te quedan clases disponibles con tu plan actual');
      return;
    }

    // Antelación mínima para reservar (default 30 min)
    const antelacion = sedeHome?.antelacionReservaMinutos ?? 30;
    const minutosRestantes =
      (new Date(c.inicio).getTime() - Date.now()) / 60_000;
    if (minutosRestantes <= antelacion) {
      toast.error(
        `Esta clase comienza en menos de ${antelacion} minutos. Las reservas cierran ${antelacion} minutos antes del inicio.`
      );
      return;
    }

    if (c.motivoNoDisponible === 'FUERA_DE_VENTANA') {
      toast.error('Esta clase aún no está disponible para reservar');
      return;
    }
    if (c.cupo - c.reservas <= 0) {
      toast.error('La clase está llena');
      return;
    }
    setConfirm({ kind: 'reservar', clase: c });
  }

  async function confirmar() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.kind === 'reservar') {
        await reservar(confirm.clase.id);
        toast.success('Reserva confirmada');
      } else {
        await cancelarReserva(confirm.reservaId);
        toast.success('Reserva cancelada');
      }
      setConfirm(null);
      await Promise.all([loadClases(), loadSubs()]);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  const selectedSalon = salones.find((s) => s.id === selectedSalonId);

  return (
    <div className="page agenda">
      <header className="agenda-head">
        <div>
          <div className="tag-label">Clases disponibles</div>
          <h1 className="page-title">Agenda</h1>
        </div>
      </header>

      {/* Pills sede / salón */}
      {(showSedePill || showSalonPill) && (
        <div className="pills-row">
          {showSedePill && selectedSede && (
            <div className="pill-wrap">
              <button
                className={'pill-select' + (isVisitor ? ' visitor' : '')}
                onClick={() => {
                  setSedeDropdown((v) => !v);
                  setSalonDropdown(false);
                }}
              >
                <span className="pill-icon">📍</span>
                <span>{selectedSede.nombre}</span>
                {isVisitor && (
                  <span className="pill-visitor-badge">VISITANTE</span>
                )}
                <span className="pill-caret">⌄</span>
              </button>
              {sedeDropdown && (
                <>
                  <div
                    className="dropdown-backdrop"
                    onClick={() => setSedeDropdown(false)}
                  />
                  <div className="dropdown">
                    {sedes.map((s) => (
                      <button
                        key={s.id}
                        className={
                          'dropdown-item' +
                          (s.id === selectedSedeId ? ' active' : '')
                        }
                        onClick={() => handleSedeChange(s.id)}
                      >
                        <span>{s.nombre}</span>
                        {!s.esHome && (
                          <span className="dropdown-hint">(visitante)</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {showSalonPill && (
            <div className="pill-wrap">
              <button
                className="pill-select"
                onClick={() => {
                  setSalonDropdown((v) => !v);
                  setSedeDropdown(false);
                }}
              >
                <span className="pill-icon">▦</span>
                <span>{selectedSalon ? selectedSalon.nombre : 'Todos'}</span>
                <span className="pill-caret">⌄</span>
              </button>
              {salonDropdown && (
                <>
                  <div
                    className="dropdown-backdrop"
                    onClick={() => setSalonDropdown(false)}
                  />
                  <div className="dropdown">
                    <button
                      className={
                        'dropdown-item' +
                        (selectedSalonId === undefined ? ' active' : '')
                      }
                      onClick={() => handleSalonChange(undefined)}
                    >
                      Todos los salones
                    </button>
                    {salones.map((s) => (
                      <button
                        key={s.id}
                        className={
                          'dropdown-item' +
                          (s.id === selectedSalonId ? ' active' : '')
                        }
                        onClick={() => handleSalonChange(s.id)}
                      >
                        {s.nombre}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Banner visitante */}
      {isVisitor && selectedSede && (
        <div className="visitor-banner">
          <span className="visitor-banner-icon">ℹ</span>
          <span>
            Estás viendo clases en <strong>{selectedSede.nombre}</strong>. Tu
            plan permite reservar en otras sedes.
          </span>
        </div>
      )}

      {/* Semana */}
      <div className="week-nav">
        <button
          className="week-nav-btn"
          onClick={() => setWeekRef(addDays(weekRef, -7))}
        >
          ←
        </button>
        <div className="week-strip">
          {days.map((d, i) => {
            const active = sameDay(d.toISOString(), selectedDay);
            return (
              <button
                key={i}
                onClick={() => setSelectedDay(d)}
                className={'week-day' + (active ? ' active' : '')}
              >
                <div className="week-day-letter">{DAY_LETTERS[i]}</div>
                <div className="week-day-num italiana">{d.getDate()}</div>
              </button>
            );
          })}
        </div>
        <button
          className="week-nav-btn"
          onClick={() => setWeekRef(addDays(weekRef, 7))}
        >
          →
        </button>
      </div>

      {/* Sub-header del día */}
      {activa && (
        <div className="day-header">
          <div className="italiana day-header-title">
            {formatDateLong(selectedDay.toISOString())}
          </div>
          <div className="tag-label">
            {clasesDelDia.length} clases
            {reservadasDelDia > 0
              ? ` · ${reservadasDelDia} reservada${reservadasDelDia === 1 ? '' : 's'}`
              : ''}
          </div>
        </div>
      )}

      {!activa ? (
        <div className="card agenda-empty">
          <div className="tag-label">Sin plan activo</div>
          <div className="italiana agenda-empty-msg">
            Necesitás un plan activo para ver la agenda.
          </div>
        </div>
      ) : loading ? (
        <div className="card agenda-empty">
          <div className="tag-label">Cargando…</div>
        </div>
      ) : clasesDelDia.length === 0 ? (
        <div className="card agenda-empty">
          <div className="tag-label">Sin clases</div>
          <div className="italiana agenda-empty-msg">
            No hay clases este día.
          </div>
        </div>
      ) : (
        <div className="class-list">
          {clasesDelDia.map((c) => (
            <button
              key={c.id}
              className={
                'class-row' +
                (c.yaReservada ? ' booked' : '') +
                (!c.yaReservada && isPast(c) ? ' past' : '')
              }
              onClick={() => onClaseClick(c)}
            >
              <div className="class-time">
                <div className="class-time-h italiana">
                  {formatTime(c.inicio)}
                </div>
                <div className="class-time-p">
                  {durationMinutes(c.inicio, c.fin)} min
                </div>
              </div>
              <div className="class-body">
                <div className="class-name italiana">{c.actividad}</div>
                <div className="class-meta">
                  {[
                    c.instructor,
                    `${durationMinutes(c.inicio, c.fin)} min`,
                    showSalonPill && c.salon ? c.salon.nombre : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
              <div className="class-status">{statusBadge(c)}</div>
              {c.yaReservada && (
                <Watermark
                  color="white"
                  size={140}
                  opacity={0.07}
                  position={{ bottom: -20, right: -20 }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {confirm && (
        <div
          className="modal-backdrop"
          onClick={() => !busy && setConfirm(null)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="tag-label">
              {confirm.kind === 'reservar'
                ? 'Reservar clase'
                : 'Cancelar reserva'}
            </div>
            <div className="italiana modal-title">{confirm.clase.actividad}</div>
            <div className="modal-meta">
              {formatDateLong(confirm.clase.inicio)} ·{' '}
              {formatTime(confirm.clase.inicio)}
            </div>
            {confirm.clase.instructor && (
              <div className="modal-meta">{confirm.clase.instructor}</div>
            )}
            <div className="modal-meta">
              {confirm.clase.sede.nombre}
              {confirm.clase.salon ? ` · ${confirm.clase.salon.nombre}` : ''}
            </div>
            {confirm.kind === 'reservar' && isVisitor && (
              <div className="modal-visitor">
                Vas a reservar en <strong>{selectedSede?.nombre}</strong>{' '}
                (visitante)
              </div>
            )}

            <div className="modal-actions">
              <button
                className="modal-secondary"
                onClick={() => setConfirm(null)}
                disabled={busy}
              >
                Volver
              </button>
              <button
                className="btn-taupe"
                onClick={confirmar}
                disabled={busy}
              >
                {busy
                  ? 'Enviando…'
                  : confirm.kind === 'reservar'
                  ? 'Confirmar'
                  : 'Cancelar reserva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
