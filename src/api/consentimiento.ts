import { apiFetch } from './client';
import type { ConsentimientoTexto, ConsentimientoFirmado } from '../types';

export function getConsentimientoTexto() {
  return apiFetch<ConsentimientoTexto>('/consentimiento/texto', { auth: false });
}

export function firmarConsentimiento(firma: string, version: string) {
  return apiFetch<void>('/consentimiento', {
    method: 'POST',
    body: { firma, version },
  });
}

export function getConsentimientoFirmado() {
  return apiFetch<ConsentimientoFirmado>('/consentimiento/firmado');
}
