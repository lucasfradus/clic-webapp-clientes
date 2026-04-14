import { apiFetch } from './client';

export function reservar(claseId: number) {
  return apiFetch<{ reservaId: number }>('/reservas', {
    method: 'POST',
    body: { claseId },
  });
}

export function cancelarReserva(reservaId: number) {
  return apiFetch<void>('/reservas', {
    method: 'DELETE',
    query: { reservaId },
  });
}
