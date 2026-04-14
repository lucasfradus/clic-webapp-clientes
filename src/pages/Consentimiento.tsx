import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import {
  getConsentimientoTexto,
  firmarConsentimiento,
} from '../api/consentimiento';
import { useAuth } from '../store/auth';
import { toast } from '../store/toast';
import { ApiError } from '../api/client';
import type { ConsentimientoTexto } from '../types';
import './Consentimiento.css';

export default function Consentimiento() {
  const [data, setData] = useState<ConsentimientoTexto | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const sigRef = useRef<SignatureCanvas | null>(null);
  const fetchPerfil = useAuth((s) => s.fetchPerfil);
  const navigate = useNavigate();

  useEffect(() => {
    getConsentimientoTexto()
      .then(setData)
      .catch((e: ApiError) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  function clearSig() {
    sigRef.current?.clear();
    setHasSignature(false);
  }

  async function submit() {
    if (!data || !sigRef.current || sigRef.current.isEmpty()) {
      toast.error('Por favor firmá antes de continuar');
      return;
    }
    setSubmitting(true);
    try {
      const firma = sigRef.current.getCanvas().toDataURL('image/png');
      await firmarConsentimiento(firma, data.version);
      await fetchPerfil();
      toast.success('Consentimiento firmado');
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="full-loader">Cargando…</div>;
  if (!data) return <div className="full-loader">No se pudo cargar</div>;

  return (
    <div className="consent-page">
      <div className="consent-card">
        <div className="tag-label">Antes de empezar</div>
        <h1 className="page-title">{data.titulo}</h1>

        <div className="consent-text">
          {data.texto.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>

        <div className="consent-sign">
          <div className="tag-label">Firmá aquí</div>
          <div className="consent-canvas">
            <SignatureCanvas
              ref={sigRef}
              penColor="#2c2f34"
              canvasProps={{
                className: 'sig-canvas',
                width: 560,
                height: 180,
              }}
              onEnd={() => setHasSignature(!sigRef.current?.isEmpty())}
            />
          </div>
          <button className="consent-clear" onClick={clearSig} type="button">
            Limpiar firma
          </button>
        </div>

        <label className="consent-accept">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span>Leí y acepto el consentimiento informado</span>
        </label>

        <button
          className="btn-taupe consent-submit"
          disabled={!accepted || !hasSignature || submitting}
          onClick={submit}
        >
          {submitting ? 'Enviando…' : 'Firmar y continuar'}
        </button>
      </div>
    </div>
  );
}
