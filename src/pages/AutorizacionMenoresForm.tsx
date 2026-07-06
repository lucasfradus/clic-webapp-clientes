import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAutorizacionMenoresTexto,
  getAutorizacionMenoresFirmado,
  enviarAutorizacionMenores,
} from '../api/autorizacionMenores';
import { useAuth } from '../store/auth';
import { toast } from '../store/toast';
import { ApiError } from '../api/client';
import { fileToCompressedDataUri } from '../lib/image';
import { sanitizeHtml } from '../lib/sanitize';
import type {
  AutorizacionMenoresTexto,
  AutorizacionMenoresFirmado,
  TutorRelacion,
} from '../types';
import './Forms.css';

const RELACIONES: { value: TutorRelacion; label: string }[] = [
  { value: 'MADRE', label: 'Madre' },
  { value: 'PADRE', label: 'Padre' },
  { value: 'TUTOR', label: 'Tutor/a' },
];

export default function AutorizacionMenoresForm() {
  const fetchPerfil = useAuth((s) => s.fetchPerfil);
  const navigate = useNavigate();

  const [data, setData] = useState<AutorizacionMenoresTexto | null>(null);
  const [firmado, setFirmado] = useState<AutorizacionMenoresFirmado | null>(null);
  const [status, setStatus] = useState<'loading' | 'error' | 'ok'>('loading');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [contacto, setContacto] = useState('');
  const [relacion, setRelacion] = useState<TutorRelacion | null>(null);
  const [documento, setDocumento] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [texto, estado] = await Promise.all([
        getAutorizacionMenoresTexto(),
        getAutorizacionMenoresFirmado(),
      ]);
      // Guard con datos frescos del backend (no con el perfil cacheado del
      // store): solo se puede enviar si nunca se envió o fue rechazada.
      if (
        !estado.requerido ||
        estado.estado === 'PENDIENTE' ||
        estado.estado === 'APROBADA'
      ) {
        navigate('/perfil/autorizacion-menores', { replace: true });
        return;
      }
      setFirmado(estado);
      setData(texto);
      setStatus('ok');
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      setStatus('error');
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (!file) return;
    try {
      setDocumento(await fileToCompressedDataUri(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No pudimos leer la imagen');
    }
  }

  async function submit() {
    if (!data) return;
    if (!nombre.trim() || !apellido.trim() || !dni.trim() || !contacto.trim()) {
      toast.error('Completá todos los datos del tutor');
      return;
    }
    if (!relacion) {
      toast.error('Indicá la relación con el tutor');
      return;
    }
    if (!documento) {
      toast.error('Adjuntá una foto del documento del tutor');
      return;
    }
    setSubmitting(true);
    try {
      await enviarAutorizacionMenores({
        firma: 'Acepto los términos de la autorización',
        documento,
        version: data.version,
        tutorNombre: nombre.trim(),
        tutorApellido: apellido.trim(),
        tutorDni: dni.trim(),
        tutorContacto: contacto.trim(),
        tutorRelacion: relacion,
      });
      // Best-effort, sin await: la página de estado consulta /firmado fresco.
      fetchPerfil().catch(() => {});
      toast.success('Autorización enviada. Queda en revisión por el estudio.');
      navigate('/perfil/autorizacion-menores', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page form-page">
      <header className="form-head">
        <button
          className="form-back"
          onClick={() => navigate('/perfil/autorizacion-menores')}
        >
          ← Autorización
        </button>
        <div className="tag-label">Autogestión</div>
        <h1 className="page-title">
          {data?.titulo ?? 'Autorización de menores'}
        </h1>
      </header>

      <div className="card form-card">
        {status === 'loading' ? (
          <div className="tag-label">Cargando…</div>
        ) : status === 'error' ? (
          <>
            <div className="tag-label">No se pudo cargar</div>
            <div>
              <button className="btn-taupe" onClick={load}>
                Reintentar
              </button>
            </div>
          </>
        ) : !data ? null : (
          <>
            {firmado?.estado === 'RECHAZADA' && (
              <p className="form-note danger">
                Tu autorización anterior fue rechazada
                {firmado.motivoRechazo ? `: ${firmado.motivoRechazo}` : ''}.
                Completá el formulario de nuevo.
              </p>
            )}

            <p className="form-note">
              Este formulario lo completa tu padre, madre o tutor/a. No bloquea
              tus reservas: podés seguir usando la app mientras el estudio la
              revisa.
            </p>

            <div
              className="readonly-text"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.texto) }}
            />

            <div className="form-row">
              <label className="form-field">
                <span className="tag-label">Nombre del tutor</span>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </label>
              <label className="form-field">
                <span className="tag-label">Apellido del tutor</span>
                <input
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                />
              </label>
            </div>
            <div className="form-row">
              <label className="form-field">
                <span className="tag-label">DNI del tutor</span>
                <input
                  inputMode="numeric"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                />
              </label>
              <label className="form-field">
                <span className="tag-label">Contacto (tel. o email)</span>
                <input
                  placeholder="Ej: +54 11 5555 1234"
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
                />
              </label>
            </div>

            <div className="form-field">
              <span className="tag-label">Relación con el alumno</span>
              <div className="pills">
                {RELACIONES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    className={'pill' + (relacion === r.value ? ' active' : '')}
                    onClick={() => setRelacion(r.value)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-field">
              <span className="tag-label">Foto del documento del tutor</span>
              {/* Sin `capture`: así el navegador ofrece cámara o galería */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onPickFile}
              />
              <button
                type="button"
                className="photo-drop"
                onClick={() => fileRef.current?.click()}
              >
                {documento ? (
                  <>
                    <img
                      className="photo-preview"
                      src={documento}
                      alt="Documento del tutor"
                    />
                    <span>Tocar para cambiar la foto</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 22 }}>⌗</span>
                    <span>Sacá o adjuntá una foto del DNI (frente)</span>
                  </>
                )}
              </button>
            </div>

            <label className="form-accept">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span>
                Soy el padre, madre o tutor/a y acepto los términos de la
                autorización
              </span>
            </label>

            <button
              className="btn-taupe form-submit"
              disabled={!accepted || !documento || submitting}
              onClick={submit}
            >
              {submitting ? 'Enviando…' : 'Enviar autorización'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
