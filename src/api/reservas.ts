import { apiFetch } from './client';
import type { ReservaResult } from '../types';

/**
 * POST /reservas. Si hay cupo, crea la reserva: { reservaId, message }. Si la
 * clase está llena, el backend inscribe en lista de espera y devuelve
 * { enListaEspera: true, posicion, yaEstaba, message }. `yaEstaba` es true si el
 * alumno ya estaba anotado (posicion trae la que ya tenía).
 */
export async function reservar(claseId: number): Promise<ReservaResult> {
  const d = await apiFetch<{
    enListaEspera?: boolean;
    posicion?: number;
    yaEstaba?: boolean;
    reservaId?: number;
    message?: string;
  }>('/reservas', { method: 'POST', body: { claseId } });
  return {
    enListaEspera: d.enListaEspera === true,
    posicion: d.posicion,
    yaEstaba: d.yaEstaba === true,
    reservaId: d.reservaId,
    message: d.message,
  };
}

export function cancelarReserva(reservaId: number) {
  return apiFetch<void>('/reservas', {
    method: 'DELETE',
    query: { reservaId },
  });
}

/**
 * DELETE /reservas/lista-espera?claseId=... — sale de la lista de espera de una
 * clase. Distinto de cancelar una reserva confirmada (DELETE /reservas?reservaId).
 * Si no estaba en la lista, el backend responde 404 { error }.
 */
export function salirListaEspera(claseId: number) {
  return apiFetch<void>('/reservas/lista-espera', {
    method: 'DELETE',
    query: { claseId },
  });
}
