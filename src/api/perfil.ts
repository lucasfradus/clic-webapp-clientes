import { apiFetch } from './client';
import type { Perfil, Sede } from '../types';

export function getPerfil() {
  return apiFetch<Perfil>('/perfil');
}

export function updatePerfil(body: {
  nombre: string;
  apellido: string;
  telefono: string | null;
  dni: string | null;
  sexo: string | null;
  direccion: string | null;
  fechaNacimiento: string | null;
}) {
  return apiFetch<{ message: string }>('/perfil', { method: 'PUT', body });
}

export function getSede() {
  return apiFetch<Sede>('/sede');
}
