// Tracking local (por dispositivo) del id maximo de novedad que el alumno vio.
// Cualquier novedad con id mayor cuenta como "no leida".

const KEY_PREFIX = 'clic_novedades_lastSeenId_';

function key(alumnoId: number): string {
  return `${KEY_PREFIX}${alumnoId}`;
}

export function getLastSeenNovedadId(alumnoId: number): number {
  try {
    const raw = localStorage.getItem(key(alumnoId));
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function setLastSeenNovedadId(alumnoId: number, novedadId: number): void {
  try {
    const current = getLastSeenNovedadId(alumnoId);
    if (novedadId > current) {
      localStorage.setItem(key(alumnoId), String(novedadId));
    }
  } catch {
    // localStorage puede fallar (modo privado en Safari, etc) — ignorar.
  }
}
