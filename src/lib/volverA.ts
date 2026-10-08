// Link compartible (ej. /consultorio): si el socio llega sin sesión, se guarda a
// dónde iba y Login lo devuelve ahí. sessionStorage: muere con la pestaña.
// Leer no borra (el render puede correr dos veces): se borra al llegar a destino.
const KEY = 'volverA';

export function guardarVolverA(path: string) {
  try {
    if (path && path !== '/' && path !== '/login') sessionStorage.setItem(KEY, path);
  } catch {
    /* storage bloqueado: se vuelve al Home */
  }
}

/** Destino guardado, solo si es una ruta interna. */
export function leerVolverA(): string | null {
  try {
    const path = sessionStorage.getItem(KEY);
    return path && path.startsWith('/') && !path.startsWith('//') ? path : null;
  } catch {
    return null;
  }
}

/** Llegó a `path`: si era el destino guardado, ya no hace falta. */
export function llegoA(path: string) {
  try {
    if (sessionStorage.getItem(KEY) === path) sessionStorage.removeItem(KEY);
  } catch {
    /* nada */
  }
}
