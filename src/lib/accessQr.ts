// Caché local del qrValue de acceso, para poder mostrarlo sin conexión.
// El valor es único por alumno, así que guardamos el ownerId (perfil.id) para
// no mostrar la credencial de otra cuenta si alguien cambia de usuario.

const KEY = 'clic_access_qr';

interface Cached {
  ownerId: number;
  qrValue: string;
}

/** Devuelve el qrValue cacheado si pertenece a `ownerId`, o null. */
export function getCachedQr(ownerId: number): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Cached;
    return data.ownerId === ownerId && typeof data.qrValue === 'string'
      ? data.qrValue
      : null;
  } catch {
    return null;
  }
}

export function setCachedQr(ownerId: number, qrValue: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ownerId, qrValue }));
  } catch {
    // localStorage puede fallar (modo privado en Safari, etc) — ignorar.
  }
}

/** Borra la credencial cacheada. Llamar al cerrar sesión / cambiar de cuenta. */
export function clearCachedQr(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
