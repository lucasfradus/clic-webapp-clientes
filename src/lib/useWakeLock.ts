import { useEffect } from 'react';

/**
 * Mantiene la pantalla encendida mientras el componente está montado (Screen Wake
 * Lock). Lo re-pide al volver a la pestaña porque el navegador lo suelta al ocultarla.
 * Sin soporte o sin permiso no hace nada: la pantalla puede apagarse, no es crítico.
 */
export function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let activo = true;
    const pedir = async () => {
      if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
      try {
        const nuevo = await navigator.wakeLock.request('screen');
        if (activo) lock = nuevo;
        else nuevo.release().catch(() => {});
      } catch {
        // Sin permiso / no soportado.
      }
    };
    pedir();
    document.addEventListener('visibilitychange', pedir);
    return () => {
      activo = false;
      document.removeEventListener('visibilitychange', pedir);
      lock?.release().catch(() => {});
    };
  }, []);
}
