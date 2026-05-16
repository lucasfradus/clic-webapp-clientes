import { useEffect, useMemo, useState } from 'react';
import Watermark from '../components/brand/Watermark';
import { getSuscripciones } from '../api/suscripciones';
import { useAuth } from '../store/auth';
import { useSelectedSede } from '../store/sede';
import type { Suscripcion, SuscripcionEstado } from '../types';
import { formatShortDate, daysFromNow, formatARS } from '../lib/date';
import { ApiError } from '../api/client';
import { toast } from '../store/toast';
import './Cuenta.css';

const estadoLabel: Record<SuscripcionEstado, string> = {
  ACTIVA: 'Activo',
  VENCIDA: 'Vencido',
  CANCELADA: 'Cancelado',
  PAUSADA: 'Pausado',
  CAMBIO_PLAN: 'Cambio de plan',
};

function badgeClass(estado: SuscripcionEstado): string {
  if (estado === 'ACTIVA') return 'badge ok';
  if (estado === 'VENCIDA') return 'badge lw';
  return 'badge fu';
}

export default function Cuenta() {
  const perfil = useAuth((s) => s.perfil);
  const fetchPerfil = useAuth((s) => s.fetchPerfil);
  const selectedSede = useSelectedSede();
  const sedeId = selectedSede?.id;

  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchPerfil(), getSuscripciones()])
      .then(([, subs]) => setSuscripciones(subs))
      .catch((e: ApiError) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [fetchPerfil]);

  // Sub que aplica a la sede seleccionada (local > multisede > primera).
  const stats = useMemo(() => {
    const activas = suscripciones.filter((s) => s.estado === 'ACTIVA');
    if (sedeId === undefined) return activas[0];
    return (
      activas.find((s) => s.sedeId === sedeId) ??
      activas.find((s) => s.accesoMultisede)
    );
  }, [suscripciones, sedeId]);

  // Pagos filtrados por la sede seleccionada (todo si no hay sede).
  const pagos = useMemo(() => {
    const list = perfil?.ultimosPagos ?? [];
    return sedeId === undefined ? list : list.filter((p) => p.sedeId === sedeId);
  }, [perfil, sedeId]);

  // Para la card de plan, derivamos del stats (sub) + el ultimo pago de esa sede.
  const plan = stats
    ? {
        plan: stats.plan,
        estado: stats.estado,
        vigenciaHasta: stats.fin,
        fechaPago: pagos[0]?.fechaPago ?? null,
      }
    : null;

  const diasRestantes = plan?.vigenciaHasta
    ? daysFromNow(plan.vigenciaHasta)
    : null;
  const vencido = diasRestantes !== null && diasRestantes < 0;

  return (
    <div className="page cuenta">
      <header className="cuenta-head">
        <div className="tag-label">Mi cuenta</div>
        <h1 className="page-title">Tu plan</h1>
      </header>

      {loading && !plan ? (
        <div className="card">Cargando…</div>
      ) : !plan ? (
        <div className="card cuenta-empty">
          <div className="tag-label">Sin plan</div>
          <div className="italiana cuenta-empty-msg">
            Todavía no tenés un plan activo.
          </div>
          <div className="cuenta-stat-sub">
            Consultá con tu sede para empezar.
          </div>
        </div>
      ) : (
        <>
          {/* Plan card */}
          <div className="card-dark balance-card">
            <Watermark
              color="accent"
              size={26}
              opacity={0.9}
              position={{ top: 26, right: 28 }}
            />
            <div
              className="tag-label"
              style={{ color: 'rgba(253,251,250,0.5)' }}
            >
              Mi plan
            </div>
            <div className="balance-amount italiana plan-name">
              {plan.plan}
            </div>

            <div className="plan-dates">
              {plan.fechaPago && (
                <div className="plan-date-row">
                  <span
                    className="tag-label"
                    style={{ color: 'rgba(253,251,250,0.5)' }}
                  >
                    Pagaste
                  </span>
                  <span>{formatShortDate(plan.fechaPago)}</span>
                </div>
              )}
              <div className="plan-date-row">
                <span
                  className="tag-label"
                  style={{ color: 'rgba(253,251,250,0.5)' }}
                >
                  {vencido ? 'Venció' : 'Vence'}
                </span>
                {plan.vigenciaHasta ? (
                  <span className={vencido ? 'plan-vencido' : ''}>
                    {formatShortDate(plan.vigenciaHasta)}
                    {vencido && diasRestantes !== null && (
                      <span className="plan-vencido-extra">
                        {' · '}
                        hace{' '}
                        {Math.abs(diasRestantes)}{' '}
                        {Math.abs(diasRestantes) === 1 ? 'día' : 'días'}
                      </span>
                    )}
                  </span>
                ) : (
                  <span>Sin vencimiento fijo</span>
                )}
              </div>
            </div>

            <div className="balance-status">
              <span className={badgeClass(plan.estado)}>
                {estadoLabel[plan.estado] ?? plan.estado}
              </span>
            </div>
          </div>

          {/* Stats de accesos (vienen de /suscripciones) */}
          {stats && (
            <div className="cuenta-stats">
              {stats.grupos && stats.grupos.length > 0 ? (
                stats.grupos.map((g) => (
                  <div key={g.id} className="card">
                    <div className="tag-label">{g.nombre}</div>
                    <div className="cuenta-stat-big italiana">
                      {g.accesosUsados} / {g.accesos}
                    </div>
                    <div className="cuenta-stat-sub">
                      {Math.max(0, g.accesos - g.accesosUsados)} restantes
                    </div>
                  </div>
                ))
              ) : (
                <div className="card">
                  <div className="tag-label">Clases</div>
                  <div className="cuenta-stat-big italiana">
                    {stats.accesosUsados} / {stats.accesos}
                  </div>
                  <div className="cuenta-stat-sub">
                    {Math.max(
                      0,
                      stats.accesos + stats.accesosExtra - stats.accesosUsados
                    )}{' '}
                    restantes
                  </div>
                  <span className="badge ok" style={{ marginTop: 12 }}>
                    En curso
                  </span>
                </div>
              )}
              <div className="card">
                <div className="tag-label">Cancelaciones</div>
                <div className="cuenta-stat-big italiana">
                  {stats.cancelacionesUsadas} / {stats.cancelaciones}
                </div>
                <div className="cuenta-stat-sub">
                  {Math.max(
                    0,
                    stats.cancelaciones - stats.cancelacionesUsadas
                  )}{' '}
                  restantes
                </div>
                <span className="badge tuya" style={{ marginTop: 12 }}>
                  Este mes
                </span>
              </div>
            </div>
          )}

          {stats && stats.accesosExtra > 0 && (
            <div className="card cuenta-extra">
              <div className="tag-label">Accesos extra</div>
              <div className="italiana cuenta-extra-num">
                +{stats.accesosExtra}
              </div>
              <div className="cuenta-stat-sub">
                Cortesía incluida en tu plan
              </div>
            </div>
          )}
        </>
      )}

      {/* Historial de pagos */}
      <div className="cuenta-section-head">
        <div className="tag-label">Historial de pagos</div>
      </div>

      {pagos.length === 0 ? (
        <div className="card cuenta-placeholder">
          <div className="italiana" style={{ fontSize: 20 }}>
            No hay pagos registrados
          </div>
          <div className="cuenta-stat-sub" style={{ marginTop: 6 }}>
            Cuando tu sede registre un pago, lo vas a ver acá.
          </div>
        </div>
      ) : (
        <div className="card pagos-list">
          {pagos.map((p) => (
            <div key={p.id} className="pago-row">
              <div className="pago-date italiana">
                {formatShortDate(p.fechaPago)}
              </div>
              <div className="pago-body">
                <div className="pago-plan">{p.plan}</div>
              </div>
              <div className="pago-monto italiana">{formatARS(p.monto)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
