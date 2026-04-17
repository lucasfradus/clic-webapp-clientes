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
import { formatShortDate } from '../lib/date';
import type {
  ConsentimientoTexto,
  ContactoEmergencia,
  DatosSalud,
} from '../types';
import './Consentimiento.css';
import './Forms.css';

type ConsentData = Extract<ConsentimientoTexto, { requerido: true }>;

const SALUD_LABELS: { key: keyof DatosSalud; label: string }[] = [
  { key: 'cardiacas', label: 'Enfermedades cardíacas / circulatorias' },
  { key: 'oseas', label: 'Problemas óseos o articulares' },
  { key: 'tiroides', label: 'Trastornos de tiroides / hormonales' },
  { key: 'respiratorias', label: 'Problemas respiratorios (asma, EPOC)' },
  { key: 'cirugias', label: 'Cirugías recientes (menos de 1 año)' },
  { key: 'musculares', label: 'Lesiones musculares o tendinosas activas' },
  { key: 'hipertension', label: 'Hipertensión / Hipotensión' },
  { key: 'intoleranciaCalor', label: 'Intolerancia al calor / golpe de calor previo' },
  { key: 'embarazo', label: 'Embarazo' },
  { key: 'diabetes', label: 'Diabetes / trastornos metabólicos' },
  { key: 'mareos', label: 'Mareos, vértigo o pérdidas de conocimiento' },
  { key: 'otra', label: 'Otra condición' },
];

const INIT_EMERGENCIA: ContactoEmergencia = {
  nombre1: '', telefono1: '', vinculo1: '', telefonoAlt1: '',
  nombre2: '', telefono2: '', vinculo2: '', telefonoAlt2: '',
};

const INIT_SALUD: DatosSalud = {
  cardiacas: false, oseas: false, tiroides: false, respiratorias: false,
  cirugias: false, musculares: false, hipertension: false,
  intoleranciaCalor: false, embarazo: false, embarazoSemanas: null,
  diabetes: false, mareos: false, otra: false, detalle: '',
};

export default function Consentimiento() {
  const perfil = useAuth((s) => s.perfil);
  const fetchPerfil = useAuth((s) => s.fetchPerfil);
  const navigate = useNavigate();

  const [data, setData] = useState<ConsentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [emergencia, setEmergencia] = useState<ContactoEmergencia>(INIT_EMERGENCIA);
  const [salud, setSalud] = useState<DatosSalud>(INIT_SALUD);
  const [accepted, setAccepted] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const sigRef = useRef<SignatureCanvas | null>(null);

  useEffect(() => {
    getConsentimientoTexto()
      .then((res) => {
        if (!res.requerido) {
          // Sede sin consentimiento: marcar como firmado para romper el loop
          // de redirect entre / (exige consent) y /consentimiento (requerido: false)
          useAuth.setState((s) =>
            s.perfil
              ? { perfil: { ...s.perfil, consentimientoFirmado: true } }
              : {}
          );
          navigate('/', { replace: true });
          return;
        }
        setData(res);
      })
      .catch((e: ApiError) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  function setEm(field: keyof ContactoEmergencia, value: string) {
    setEmergencia((prev) => ({ ...prev, [field]: value }));
  }

  function toggleSalud(field: keyof DatosSalud) {
    setSalud((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  function clearSig() {
    sigRef.current?.clear();
    setHasSignature(false);
  }

  async function submit() {
    if (!data || !sigRef.current || sigRef.current.isEmpty()) {
      toast.error('Por favor firmá antes de continuar');
      return;
    }
    if (!emergencia.nombre1.trim() || !emergencia.telefono1.trim()) {
      toast.error('Completá al menos el nombre y teléfono del contacto de emergencia 1');
      return;
    }
    setSubmitting(true);
    try {
      const firma = sigRef.current.getCanvas().toDataURL('image/png');
      await firmarConsentimiento({
        firma,
        version: data.version,
        consentimientoId: data.id,
        emergencia,
        salud,
      });
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

        {/* Datos personales (read-only) */}
        {perfil && (
          <section className="consent-section">
            <div className="consent-section-title">Datos personales</div>
            <div className="form-row">
              <label className="form-field">
                <span className="tag-label">Nombre</span>
                <input value={perfil.nombre} disabled />
              </label>
              <label className="form-field">
                <span className="tag-label">Apellido</span>
                <input value={perfil.apellido} disabled />
              </label>
            </div>
            <div className="form-row" style={{ marginTop: 14 }}>
              <label className="form-field">
                <span className="tag-label">Email</span>
                <input value={perfil.email} disabled />
              </label>
              <label className="form-field">
                <span className="tag-label">Teléfono</span>
                <input value={perfil.telefono ?? '—'} disabled />
              </label>
            </div>
            <div className="form-row" style={{ marginTop: 14 }}>
              <label className="form-field">
                <span className="tag-label">DNI</span>
                <input value={perfil.dni ?? '—'} disabled />
              </label>
              <label className="form-field">
                <span className="tag-label">Nacimiento</span>
                <input
                  value={
                    perfil.fechaNacimiento
                      ? formatShortDate(perfil.fechaNacimiento)
                      : '—'
                  }
                  disabled
                />
              </label>
            </div>
          </section>
        )}

        {/* Contactos de emergencia */}
        <section className="consent-section">
          <div className="consent-section-title">Contacto de emergencia 1</div>
          <div className="form-row">
            <label className="form-field">
              <span className="tag-label">Nombre completo</span>
              <input
                value={emergencia.nombre1}
                onChange={(e) => setEm('nombre1', e.target.value)}
              />
            </label>
            <label className="form-field">
              <span className="tag-label">Teléfono</span>
              <input
                value={emergencia.telefono1}
                onChange={(e) => setEm('telefono1', e.target.value)}
              />
            </label>
          </div>
          <div className="form-row" style={{ marginTop: 14 }}>
            <label className="form-field">
              <span className="tag-label">Vínculo</span>
              <input
                placeholder="Ej: madre, pareja"
                value={emergencia.vinculo1}
                onChange={(e) => setEm('vinculo1', e.target.value)}
              />
            </label>
            <label className="form-field">
              <span className="tag-label">Teléfono alternativo</span>
              <input
                value={emergencia.telefonoAlt1}
                onChange={(e) => setEm('telefonoAlt1', e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="consent-section">
          <div className="consent-section-title">Contacto de emergencia 2</div>
          <div className="form-row">
            <label className="form-field">
              <span className="tag-label">Nombre completo</span>
              <input
                value={emergencia.nombre2}
                onChange={(e) => setEm('nombre2', e.target.value)}
              />
            </label>
            <label className="form-field">
              <span className="tag-label">Teléfono</span>
              <input
                value={emergencia.telefono2}
                onChange={(e) => setEm('telefono2', e.target.value)}
              />
            </label>
          </div>
          <div className="form-row" style={{ marginTop: 14 }}>
            <label className="form-field">
              <span className="tag-label">Vínculo</span>
              <input
                placeholder="Ej: hermano/a, amigo/a"
                value={emergencia.vinculo2}
                onChange={(e) => setEm('vinculo2', e.target.value)}
              />
            </label>
            <label className="form-field">
              <span className="tag-label">Teléfono alternativo</span>
              <input
                value={emergencia.telefonoAlt2}
                onChange={(e) => setEm('telefonoAlt2', e.target.value)}
              />
            </label>
          </div>
        </section>

        {/* Antecedentes de salud */}
        <section className="consent-section">
          <div className="consent-section-title">Antecedentes de salud</div>
          <p className="consent-salud-desc">
            Marcá las condiciones que apliquen a tu situación actual o pasada.
          </p>
          <div className="pills consent-pills">
            {SALUD_LABELS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={
                  'pill' + ((salud[key] as boolean) ? ' active' : '')
                }
                onClick={() => toggleSalud(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {salud.embarazo && (
            <label className="form-field" style={{ marginTop: 14 }}>
              <span className="tag-label">Semanas de embarazo</span>
              <input
                type="number"
                min={1}
                max={42}
                placeholder="Ej: 16"
                value={salud.embarazoSemanas ?? ''}
                onChange={(e) =>
                  setSalud((prev) => ({
                    ...prev,
                    embarazoSemanas: e.target.value
                      ? Number(e.target.value)
                      : null,
                  }))
                }
              />
            </label>
          )}

          {salud.otra && (
            <label className="form-field" style={{ marginTop: 14 }}>
              <span className="tag-label">¿Cuál?</span>
              <input
                placeholder="Describí brevemente"
                value={salud.detalle}
                onChange={(e) =>
                  setSalud((prev) => ({ ...prev, detalle: e.target.value }))
                }
              />
            </label>
          )}

          {!salud.otra && (
            <label className="form-field" style={{ marginTop: 14 }}>
              <span className="tag-label">Comentarios adicionales</span>
              <textarea
                className="consent-textarea"
                rows={3}
                placeholder="Algo más que quieras que sepamos"
                value={salud.detalle}
                onChange={(e) =>
                  setSalud((prev) => ({ ...prev, detalle: e.target.value }))
                }
              />
            </label>
          )}
        </section>

        {/* Texto del consentimiento */}
        <section className="consent-section">
          <div className="consent-section-title">Consentimiento informado</div>
          <div
            className="consent-text"
            dangerouslySetInnerHTML={{ __html: data.texto }}
          />
        </section>

        {/* Firma */}
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
