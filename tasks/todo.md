# QR de acceso en la webapp de clientes

Backend Clicnet ya listo: `GET /api/v1/control-acceso/qr` → `{ qrValue }` y el flag
`controlAcceso: { disponible, sedeMolineteId }` en cada fila de `/api/v1/sedes` y en `/api/v1/sede`.
Falta el consumo en `clic-webapp-clientes`.

Decisiones UX (confirmadas): botón en Home + vista QR fullscreen a máximo brillo percibido
(fondo blanco + Screen Wake Lock; no se puede forzar el brillo del SO desde la web).

## Tareas

- [x] 1. Tipos: `ControlAcceso { disponible, sedeMolineteId }` + `controlAcceso?` en `SedeAccesible`.
- [x] 2. Dep `qrcode.react@4.2.0` (SVG puro, offline). Build OK.
- [x] 3. API: `src/api/controlAcceso.ts` con `getCredencialQr()`.
- [x] 4. Caché offline: `src/lib/accessQr.ts` — key única `clic_access_qr` con `{ ownerId, qrValue }`;
       valida ownerId (perfil.id) y se limpia en `logout()`.
- [x] 5. Vista `src/pages/Acceso.tsx` (+ css): fullscreen blanco, QR grande, Wake Lock + re-adquisición
       en visibilitychange, botón cerrar. Estados: cargando / sin-conexión / ok.
- [x] 6. Ruta `/acceso` en `App.tsx` en `ProtectedRoute` fuera de `AppLayout`.
- [x] 7. Botón "Mostrar mi QR" en Home condicionado a `selectedSede?.controlAcceso?.disponible`.
- [x] 8. Verificación: `npm run build` (tsc -b + vite) OK; render de QRCodeSVG a SVG válido con qrValue de ejemplo.

## Notas de diseño

- El `qrValue` es único por alumno (no depende de la sede). Visibilidad = por sede seleccionada.
- Flujo Acceso: mostrar cache al instante → refrescar desde API en background → si difiere, actualizar.
- No inferir disponibilidad de `esHome` ni reglas de plan; usar `controlAcceso.disponible` de la sede seleccionada.

## Review

Implementado en rama `feat/qr-acceso-clientes`. Archivos:
- `src/types/index.ts` (+ControlAcceso), `src/api/controlAcceso.ts` (nuevo),
  `src/lib/accessQr.ts` (nuevo), `src/store/auth.ts` (clear en logout),
  `src/pages/Acceso.tsx` + `.css` (nuevos), `src/App.tsx` (ruta), `src/pages/Home.tsx` + `.css` (botón).

Verificado: build (typecheck + vite) OK; QRCodeSVG genera SVG válido.

Pendiente de prueba e2e con backend (necesita login + sede con molinete activo). El proxy de
dev apunta a prod, así que no lo probé autenticado. Máximo brillo del SO no es forzable desde web;
se resuelve con fondo blanco + Screen Wake Lock.
