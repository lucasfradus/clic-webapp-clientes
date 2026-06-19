# Feature: Lista de espera (waitlist) en reservas

## Contexto
El backend ya inscribe en lista de espera cuando una clase está llena, pero la web
muestra "Reserva creada" y no diferencia los estados. Hay que manejar el ciclo
completo: confirmada / en lista de espera (puesto N°X) / cancelada.

## Decisión clave: tolerancia de forma de API
El usuario no está seguro de (a) si las respuestas vienen envueltas en `{ ok, data }`
o "bare", ni (b) si `/turnos` devuelve los items planos o anidados bajo `clase`.
Los 8 endpoints actuales asumen respuestas BARE y planas (y funcionan en prod).
→ Aíslo TODA la lógica de forma en `unwrap()` (client.ts) y `normalizeTurno()`
  (turnos.ts), tolerantes a ambas formas. Único punto a ajustar si la realidad difiere.

## Plan
- [x] Leer y entender el código actual (Agenda, Home, Perfil, api, types)
- [ ] api/client.ts: helper `unwrap()` (devuelve .data si viene { ok, data }, si no el body)
- [ ] types/index.ts: TurnoTipo, extender Turno (tipo, claseId?, posicion?, reservaId?/estado? opcionales), ReservaResult
- [ ] api/turnos.ts: normalizeTurno() tolerante (plano o anidado) -> Turno[] con tipo
- [ ] api/reservas.ts: reservar() -> ReservaResult (enListaEspera/posicion/yaEstaba); salirListaEspera(claseId)
- [ ] Agenda.tsx: clase llena -> diálogo lista de espera; badge ámbar "En lista N°X"; salir; mensajes 3 resultados; refresco en focus
- [ ] Home.tsx: sección "En lista de espera" con badge ámbar + salir + modal confirm
- [ ] CSS: .badge.wait ámbar (globals), .modal-wait, mover modal base a globals, estilos Home
- [ ] Verificar tsc/build sin errores

## Mensajería (qué evitar)
- Nunca "Reserva creada" si enListaEspera === true.
- Verde solo para confirmada, ámbar para espera. No mezclar.
- Tras promoción (backend), al refrescar el item aparece como RESERVA CONFIRMADA, no espera.

## Review
Hecho. `npm run build` (tsc -b + vite build) pasa sin errores.

Cambios:
- api/client.ts: `unwrap()` exportado (tolera { ok, data } o bare).
- types/index.ts: `TurnoTipo`, `Turno` extendido (tipo/claseId/posicion; reservaId/estado opcionales), `ReservaResult`.
- api/turnos.ts: `normalizeTurno()` tolerante (plano o anidado bajo `clase`); siempre setea `tipo`.
- api/reservas.ts: `reservar()` -> ReservaResult; `salirListaEspera(claseId)`.
- Agenda.tsx: clase llena -> diálogo "Lista de espera" (no bloquea); badge ámbar "En lista N°X";
  borde ámbar en la fila; acción "Salir"; 3 mensajes según resultado; refresco en window focus.
- Home.tsx: sección "En lista de espera" (badge ámbar + nota "todavía no tenés el lugar" + Salir) y modal confirm.
- CSS: `.badge.wait` + `.modal-wait` ámbar (con override FIT) y modal base movido a globals.css.

## Formas de API — CONFIRMADAS contra el backend (Next.js, api-auth.ts)
Se removió la tolerancia. Contrato real:
- Respuestas BARE (apiOk devuelve data tal cual). Errores `{ error }` + HTTP 4xx. -> se borró `unwrap()`.
- GET /turnos: array plano; cada item con `tipo` ('RESERVA'|'LISTA_ESPERA') y `claseId` siempre;
  `posicion` solo en LISTA_ESPERA. -> se borró `normalizeTurno()`, getTurnos devuelve `Turno[]` directo.
- POST /reservas: con cupo `{ reservaId, message }`; lleno `{ enListaEspera, posicion, yaEstaba, message }`.
- DELETE /reservas/lista-espera?claseId= (query). 404 si no estaba en la lista.
Build (`npm run build`) verde tras la simplificación.
