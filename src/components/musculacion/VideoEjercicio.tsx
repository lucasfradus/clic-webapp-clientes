import { useState } from 'react';
import { urlApi } from '../../api/client';
import './VideoEjercicio.css';

/**
 * Video de referencia de un ejercicio. Arranca como botón y recién al tocarlo
 * monta el <video>: una rutina puede tener decenas y no hace falta bajarlos todos.
 */
export default function VideoEjercicio({ url, nombre }: { url: string | null; nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  // null = el ejercicio no tiene video; "" = el backend no pudo firmarlo.
  if (!url) return null;
  if (!abierto) {
    return (
      <button type="button" className="video-ejercicio-btn" onClick={() => setAbierto(true)} aria-label={`Ver video de ${nombre}`}>
        <span aria-hidden="true">▶</span> Ver video
      </button>
    );
  }
  return (
    <video className="video-ejercicio" src={urlApi(url)} controls autoPlay playsInline preload="metadata" aria-label={`Video de ${nombre}`} />
  );
}
