import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAutorizacionMenoresFirmado } from '../api/autorizacionMenores';
import { useAuth } from '../store/auth';
import type { AutorizacionMenoresFirmado as AMF, TutorRelacion } from '../types';
import { formatDateLong } from '../lib/date';
import { ApiError } from '../api/client';
import { toast } from '../store/toast';
import './Forms.css';

const RELACION_LABEL: Record<TutorRelacion, string> = {
  PADRE: 'Padre',
  MADRE: 'Madre',
  TUTOR: 'Tutor/a',
};

export default function AutorizacionMenores() {
  const navigate = useNavigate();
  const fetchPerfil = useAuth((s) => s.fetchPerfil);
  const [data, setData] = useState<AMF | null>(null);
  const [status, setStatus] = useState<'loading' | 'error' | 'ok'>('loading');

  const load = useCallback(() => {
    setStatus('loading');
    getAutorizacionMenoresFirmado()
      .then((d) => {
        setData(d);
        setStatus('ok');
      })
      .catch((e: ApiError) => {
        toast.error(e.message);
        setStatus('error');
      });
  }, []);

  useEffect(() => {
    load();
    // Best-effort: sincroniza el perfil del store para que el aviso de Home
    // refleje el estado real (aprobación/rechazo hechos desde recepción).
    fetchPerfil().catch(() => {});
  }, [load, fetchPerfil]);

  // Reenviar solo cuando nunca se envió o fue rechazada.
  const puedeEnviar =
    data?.requerido && (data.estado == null || data.estado === 'RECHAZADA');

  return (
    <div className="page form-page">
      <header className="form-head">
        <button className="form-back" onClick={() => navigate('/perfil')}>
          ← Perfil
        </button>
        <div className="tag-label">Documento</div>
        <h1 className="page-title">Autorización de menores</h1>
      </header>

      <div className="card form-card">
        {status === 'loading' ? (
          <div className="tag-label">Cargando…</div>
        ) : status === 'error' || !data ? (
          <>
            <div className="tag-label">No se pudo cargar</div>
            <div>
              <button className="btn-taupe" onClick={load}>
                Reintentar
              </button>
            </div>
          </>
        ) : !data.requerido ? (
          <div className="tag-label" style={{ textAlign: 'center', padding: 20 }}>
            Tu sede no requiere autorización de menores.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {data.estado === 'APROBADA' && (
                <span className="badge ok">Aprobada</span>
              )}
              {data.estado === 'PENDIENTE' && (
                <span className="badge wait">En revisión</span>
              )}
              {data.estado === 'RECHAZADA' && (
                <span className="badge lw">Rechazada</span>
              )}
              {!data.firmado && !data.estado && (
                <span className="badge fu">No enviada</span>
              )}
              {data.version && (
                <span className="tag-label">Versión {data.version}</span>
              )}
            </div>

            {data.estado === 'PENDIENTE' && (
              <p className="form-note">
                La autorización fue enviada y está en revisión por el estudio.
                Te avisamos cuando la aprueben.
              </p>
            )}
            {data.estado === 'APROBADA' && (
              <p className="form-note">
                La autorización de tu tutor fue aprobada. No tenés nada más que hacer.
              </p>
            )}
            {data.estado === 'RECHAZADA' && (
              <p className="form-note danger">
                Fue rechazada{data.motivoRechazo ? `: ${data.motivoRechazo}` : ''}.
                Volvé a enviarla.
              </p>
            )}
            {!data.firmado && !data.estado && (
              <p className="form-note">
                Como sos menor de edad, tu sede pide una autorización de tu padre,
                madre o tutor/a con una foto de su documento. Podés seguir
                reservando clases mientras tanto.
              </p>
            )}

            {data.firmado && data.tutor && (
              <div className="form-field">
                <span className="tag-label">Tutor</span>
                <div style={{ fontSize: 14 }}>
                  {data.tutor.nombre} {data.tutor.apellido} ·{' '}
                  {RELACION_LABEL[data.tutor.relacion] ?? data.tutor.relacion}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  DNI {data.tutor.dni} · {data.tutor.contacto}
                </div>
              </div>
            )}

            {data.firmado && data.fecha && (
              <div className="form-field">
                <span className="tag-label">Fecha de envío</span>
                <div style={{ fontSize: 14 }}>{formatDateLong(data.fecha)}</div>
              </div>
            )}

            {data.firmado && data.documentoUrl && (
              <div className="form-field">
                <span className="tag-label">Documento del tutor</span>
                <a
                  href={data.documentoUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 13, color: 'var(--taupe-dark)' }}
                >
                  Ver foto del documento ↗
                </a>
              </div>
            )}

            {puedeEnviar && (
              <div style={{ marginTop: 6 }}>
                <button
                  className="btn-taupe"
                  onClick={() => navigate('/perfil/autorizacion-menores/enviar')}
                >
                  {data.estado === 'RECHAZADA'
                    ? 'Volver a enviar'
                    : 'Completar autorización'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
