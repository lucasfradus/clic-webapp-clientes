import { useCallback, useEffect, useState } from 'react';
import Watermark from '../components/brand/Watermark';
import { getNovedades } from '../api/novedades';
import type { Novedad } from '../types';
import { relativeFromNow } from '../lib/date';
import { ApiError } from '../api/client';
import './Novedades.css';

type Status = 'loading' | 'ok' | 'error';

export default function Novedades() {
  const [status, setStatus] = useState<Status>('loading');
  const [items, setItems] = useState<Novedad[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await getNovedades();
      setItems(data);
      setStatus('ok');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Error inesperado');
      }
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page novedades">
      <header className="nov-head">
        <div>
          <div className="tag-label">What's new</div>
          <h1 className="page-title">Novedades</h1>
        </div>
      </header>

      {status === 'loading' && (
        <div className="card nov-loading">
          <div className="tag-label">Cargando novedades…</div>
        </div>
      )}

      {status === 'error' && (
        <div className="card nov-error">
          <div className="tag-label">No pudimos cargar</div>
          <div className="italiana nov-error-title">
            {error ?? 'Algo salió mal'}
          </div>
          <button className="btn-taupe" onClick={load}>
            Reintentar
          </button>
        </div>
      )}

      {status === 'ok' && items.length === 0 && (
        <div className="card-dark nov-empty">
          <Watermark color="white" size={200} opacity={0.07} />
          <div
            className="tag-label"
            style={{ color: 'rgba(253,251,250,0.5)' }}
          >
            Todo tranquilo
          </div>
          <div className="italiana nov-empty-title">
            No hay avisos nuevos.
          </div>
          <div className="nov-empty-desc">
            Cuando tu sede publique algo importante, lo vas a ver acá.
          </div>
        </div>
      )}

      {status === 'ok' && items.length > 0 && (
        <div className="nov-list">
          {items.map((n) => (
            <article key={n.id} className="card nov-card">
              <header className="nov-card-head">
                <h2 className="nov-card-title">{n.titulo}</h2>
                <div className="tag-label">
                  {relativeFromNow(n.publicadaEn)}
                </div>
              </header>

              {n.imagenUrl && (
                <img
                  src={n.imagenUrl}
                  alt=""
                  className="nov-card-image"
                  loading="lazy"
                />
              )}

              <div
                className="nov-contenido"
                dangerouslySetInnerHTML={{ __html: n.contenido }}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
