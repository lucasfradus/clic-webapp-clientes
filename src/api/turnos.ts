import { apiFetch } from './client';
import type { Turno } from '../types';

export function getTurnos(tipo: 'proximos' | 'historial' | 'cancelados') {
  return apiFetch<Turno[]>('/turnos', { query: { tipo } });
}
