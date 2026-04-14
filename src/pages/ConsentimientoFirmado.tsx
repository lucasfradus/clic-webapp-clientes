import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConsentimientoFirmado } from '../api/consentimiento';
import type { ConsentimientoFirmado as CF } from '../types';
import { formatDateLong } from '../lib/date';
import { ApiError } from '../api/client';
import { toast } from '../store/toast';
import './Forms.css';

export default function ConsentimientoFirmado() {
  const navigate = useNavigate();
  const [data, setData] = useState<CF | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConsentimientoFirmado()
      .then(setData)
      .catch((e: ApiError) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page form-page">
      <header className="form-head">
        <button className="form-back" onClick={() => navigate('/perfil')}>
          ← Perfil
        </button>
        <div className="tag-label">Documento</div>
        <h1 className="page-title">Consentimiento</h1>
      </header>

      <div className="card form-card">
        {loading ? (
          <div className="tag-label">Cargando…</div>
        ) : !data ? (
          <div className="tag-label">Sin datos</div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="badge ok">Firmado</span>
              <span className="tag-label">Versión {data.version}</span>
            </div>
            <div className="form-field">
              <span className="tag-label">Fecha</span>
              <div style={{ fontSize: 14 }}>{formatDateLong(data.fecha)}</div>
            </div>
            {data.firma && (
              <div className="form-field">
                <span className="tag-label">Firma</span>
                <img
                  src={data.firma}
                  alt="Firma"
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--line-soft)',
                    borderRadius: 14,
                    padding: 12,
                    maxWidth: 360,
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
