import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPoliticasTexto } from '../api/politicas';
import type { PoliticasTexto } from '../types';
import { ApiError } from '../api/client';
import { toast } from '../store/toast';
import './Forms.css';

export default function Politicas() {
  const navigate = useNavigate();
  const [data, setData] = useState<PoliticasTexto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPoliticasTexto()
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
        <div className="tag-label">Establecimiento</div>
        <h1 className="page-title">{data?.titulo ?? 'Políticas'}</h1>
      </header>

      <div className="card form-card">
        {loading ? (
          <div className="tag-label">Cargando…</div>
        ) : !data ? (
          <div className="tag-label">Sin datos</div>
        ) : (
          <>
            <div className="tag-label">Versión {data.version}</div>
            <div
              className="readonly-text"
              dangerouslySetInnerHTML={{ __html: data.texto }}
            />
          </>
        )}
      </div>
    </div>
  );
}
