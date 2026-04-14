import { apiFetch } from './client';
import type { Turno } from '../types';

export function getTurnos(tipo: 'proximos' | 'historial') {
  return apiFetch<Turno[]>('/turnos', { query: { tipo } });
}
