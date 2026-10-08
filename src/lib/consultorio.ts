// Fechas del consultorio en hora argentina, independientes de la zona del
// navegador: el backend recibe y devuelve días como YYYY-MM-DD de Argentina.

const TZ = 'America/Argentina/Buenos_Aires';

const ymdFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

/** YYYY-MM-DD del día argentino que contiene `d`. */
export function ymdAR(d: Date): string {
  return ymdFmt.format(d);
}

/** Suma días a un YYYY-MM-DD (aritmética en UTC: no depende de la zona). */
export function sumarDias(ymd: string, dias: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** Los días reservables: desde hoy hasta hoy + `dias` inclusive. */
export function diasReservables(hoy: string, dias: number): string[] {
  return Array.from({ length: dias + 1 }, (_, i) => sumarDias(hoy, i));
}

const LETRAS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function partesDia(ymd: string): { letra: string; numero: number; mes: string } {
  const [y, m, d] = ymd.split('-').map(Number);
  const fecha = new Date(Date.UTC(y, m - 1, d));
  return { letra: LETRAS[fecha.getUTCDay()], numero: d, mes: MESES[m - 1] };
}

export function horaAR(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: TZ });
}

export function fechaLargaAR(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ });
}

/** ¿Todavía puede cancelar o reprogramar él mismo? */
export function puedeModificar(cancelableHasta: string, ahora: Date = new Date()): boolean {
  return new Date(cancelableHasta).getTime() > ahora.getTime();
}
