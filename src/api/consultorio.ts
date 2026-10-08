import { apiFetch } from './client';
import type { CitaConsultorio, HuecoConsultorio, ServicioConsultorio } from '../types';

/** Servicios que el socio puede reservar (nutrición, kinesio) con sus incluidas del mes. */
export function getServiciosConsultorio() {
  return apiFetch<ServicioConsultorio[]>('/consultorio');
}

/**
 * Horarios libres de un día (fecha = YYYY-MM-DD). Al reprogramar se pasa la
 * cita actual para que no cuente contra la incluida del mes.
 */
export function getHuecos(params: { sedeId: number; prestacionId: number; fecha: string; citaId?: number }) {
  return apiFetch<HuecoConsultorio[]>('/consultorio/huecos', { query: params });
}

export function getCitas(tipo: 'proximas' | 'historial') {
  return apiFetch<CitaConsultorio[]>('/consultorio/citas', { query: { tipo } });
}

export function reservarCita(body: { prestacionId: number; franjaId: number; inicio: string }) {
  return apiFetch<{ citaId: number; message: string }>('/consultorio/citas', { method: 'POST', body });
}

export function reprogramarCita(body: { citaId: number; franjaId: number; inicio: string }) {
  return apiFetch<{ message: string }>('/consultorio/citas', { method: 'PATCH', body });
}

export function cancelarCita(citaId: number) {
  return apiFetch<{ message: string }>('/consultorio/citas', { method: 'DELETE', query: { citaId } });
}
