import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatShortDate, daysFromNow, fromYMD, toYMD } from './date';

// Los tests corren en America/Argentina/Buenos_Aires (src/test/setup-tz.ts),
// que es donde se manifestaba el bug: la vigencia hasta el 02/08 se mostraba
// como "vence 01/08" porque el backend mandaba la medianoche UTC como instante.

describe('formatShortDate', () => {
  it('date-only: es lo que manda la API v1 para las fechas de calendario', () => {
    expect(formatShortDate('2026-08-02')).toBe('02/08/2026');
    expect(formatShortDate('2026-07-03')).toBe('03/07/2026');
    expect(formatShortDate('1990-05-20')).toBe('20/05/1990');
  });

  it('ISO a medianoche UTC: backend viejo, no se corre al dia anterior', () => {
    expect(formatShortDate('2026-08-02T00:00:00.000Z')).toBe('02/08/2026');
    expect(formatShortDate('2026-01-01T00:00:00.000Z')).toBe('01/01/2026');
  });

  it('instante real: se muestra en la hora del dispositivo', () => {
    // Un pago acreditado el 14/07 a las 12:37 AR.
    expect(formatShortDate('2026-07-14T15:37:08.653Z')).toBe('14/07/2026');
    // 01:00 UTC son las 22:00 del dia anterior en AR: ese es el dia que vivio
    // el alumno, y es correcto mostrarlo corrido.
    expect(formatShortDate('2026-07-15T01:00:00.000Z')).toBe('14/07/2026');
  });
});

describe('fromYMD / toYMD', () => {
  it('el picker abre en el dia elegido, no en el anterior', () => {
    const d = fromYMD('1990-05-20');
    expect(d.getFullYear()).toBe(1990);
    expect(d.getMonth() + 1).toBe(5);
    expect(d.getDate()).toBe(20);
    // Lo que hacia antes: new Date('1990-05-20') es medianoche UTC = 19/05 en AR.
    expect(new Date('1990-05-20').getDate()).toBe(19);
  });

  it('guarda el dia local, no el UTC', () => {
    expect(toYMD(new Date(1990, 4, 20))).toBe('1990-05-20');
    // A cualquier hora del dia, no solo a medianoche: `toISOString()` se corre
    // al dia siguiente de la tarde en adelante en UTC-3.
    expect(toYMD(new Date(1990, 4, 20, 21, 30))).toBe('1990-05-20');
    expect(new Date(1990, 4, 20, 21, 30).toISOString().slice(0, 10)).toBe('1990-05-21');
  });

  it('van y vuelven sin perder el dia', () => {
    for (const ymd of ['2026-01-01', '2026-08-02', '1990-05-20', '2000-12-31']) {
      expect(toYMD(fromYMD(ymd))).toBe(ymd);
    }
  });
});

describe('daysFromNow', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function hoyEnAR(iso: string) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(iso));
  }

  it('el ultimo dia de vigencia todavia no esta vencido', () => {
    // fin es INCLUSIVO: el 02/08 el alumno todavia puede entrar.
    hoyEnAR('2026-08-02T13:00:00.000Z'); // 10:00 AR del 02/08
    expect(daysFromNow('2026-08-02')).toBe(0);
  });

  it('recien al dia siguiente pasa a vencido', () => {
    hoyEnAR('2026-08-03T13:00:00.000Z'); // 10:00 AR del 03/08
    expect(daysFromNow('2026-08-02')).toBe(-1);
  });

  it('cuenta dias de calendario, no fracciones de instante', () => {
    hoyEnAR('2026-07-30T02:00:00.000Z'); // 23:00 AR del 29/07
    expect(daysFromNow('2026-08-02')).toBe(4);
  });

  it('no se adelanta el vencimiento a la noche del ultimo dia', () => {
    // Con el ISO viejo, a las 21:00 AR del 01/08 el fin (00:00 UTC del 02/08)
    // ya habia pasado y la app mostraba el plan como vencido.
    hoyEnAR('2026-08-03T00:30:00.000Z'); // 21:30 AR del 02/08
    expect(daysFromNow('2026-08-02')).toBe(0);
    expect(daysFromNow('2026-08-02T00:00:00.000Z')).toBe(0);
  });
});
