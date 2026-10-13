import { describe, expect, it } from 'vitest';
import { diaMes, indicaciones, kg, parsePeso } from './musculacion';
import type { EjercicioRutina } from '../types';

const base: EjercicioRutina = {
  ejercicioId: 1, nombre: 'Sentadilla', videoUrl: null, series: null, repeticiones: '', rir: '',
  tiempoSegundos: null, descansoSegundos: null, cargaKg: null,
};

describe('indicaciones', () => {
  it('arma series × repeticiones y suma lo que haya', () => {
    expect(indicaciones({ ...base, series: 3, repeticiones: '10–12', descansoSegundos: 60, rir: '2' })).toBe('3 × 10–12 · descanso 60 s · RIR 2');
  });
  it('se arregla con datos sueltos', () => {
    expect(indicaciones({ ...base, series: 1 })).toBe('1 serie');
    expect(indicaciones({ ...base, repeticiones: '8 por lado' })).toBe('8 por lado rep.');
    expect(indicaciones({ ...base, tiempoSegundos: 30 })).toBe('30 seg');
    expect(indicaciones(base)).toBe('');
  });
});

describe('pesos', () => {
  it('acepta coma o punto y vacío para borrar', () => {
    expect(parsePeso('12,5')).toBe(12.5);
    expect(parsePeso(' 20 ')).toBe(20);
    expect(parsePeso('')).toBeNull();
    expect(parsePeso('0')).toBe(0);
  });
  it('rechaza texto, negativos y valores absurdos', () => {
    expect(parsePeso('doce')).toBeUndefined();
    expect(parsePeso('-5')).toBeUndefined();
    expect(parsePeso('5000')).toBeUndefined();
  });
  it('muestra kg con coma y la fecha como dd/mm', () => {
    expect(kg(12.5)).toBe('12,5 kg');
    expect(diaMes('2026-10-03')).toBe('03/10');
  });
});
