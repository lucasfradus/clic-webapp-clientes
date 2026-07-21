import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../store/auth';
import { getCredencialQr } from '../api/controlAcceso';
import { getCachedQr, setCachedQr } from '../lib/accessQr';
import './Acceso.css';

type Estado = 'cargando' | 'ok' | 'sin-conexion';

export default function Acceso() {
  const navigate = useNavigate();
  const perfil = useAuth((s) => s.perfil);
  const ownerId = perfil?.id ?? null;

  const [qrValue, setQrValue] = useState<string | null>(() =>
    ownerId != null ? getCachedQr(ownerId) : null
  );
  const [estado, setEstado] = useState<Estado>('cargando');
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Refresca la credencial desde el backend. Si no hay red, cae al cache.
  useEffect(() => {
    if (ownerId == null) return;
    let cancelado = false;
    getCredencialQr()
      .then((res) => {
        if (cancelado) return;
        setQrValue(res.qrValue);
        setCachedQr(ownerId, res.qrValue);
        setEstado('ok');
      })
      .catch(() => {
        if (cancelado) return;
        // Offline / error: usamos lo cacheado si existe.
        setEstado(getCachedQr(ownerId) ? 'ok' : 'sin-conexion');
      });
    return () => {
      cancelado = true;
    };
  }, [ownerId]);

  // Screen Wake Lock: evita que la pantalla se atenúe/apague mientras se muestra
  // el QR. Se libera al salir de la vista. Se re-adquiere al volver a foco porque
  // el navegador lo suelta al ocultar la pestaña.
  const pedirWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
    } catch {
      // Sin permiso / no soportado: la pantalla puede atenuarse, no es crítico.
    }
  }, []);

  useEffect(() => {
    pedirWakeLock();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') pedirWakeLock();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [pedirWakeLock]);

  return (
    <div className="acceso">
      <button
        type="button"
        className="acceso-back"
        onClick={() => navigate('/')}
        aria-label="Volver"
      >
        ✕
      </button>

      {qrValue ? (
        <div className="acceso-body">
          <div className="acceso-qr">
            <QRCodeSVG value={qrValue} size={260} level="M" marginSize={2} />
          </div>
          <div className="acceso-nombre">
            {perfil ? `${perfil.nombre} ${perfil.apellido}` : ''}
          </div>
          <div className="acceso-hint">Acercá este código al lector</div>
        </div>
      ) : estado === 'sin-conexion' ? (
        <div className="acceso-body">
          <div className="acceso-msg">
            Conectate una vez para habilitar tu QR de acceso.
          </div>
        </div>
      ) : (
        <div className="acceso-body">
          <div className="acceso-msg subtle">Generando tu credencial…</div>
        </div>
      )}
    </div>
  );
}
