# Fix: loop infinito / ↔ /consentimiento (usuario menor, Sede Test)

## Diagnóstico
- ProtectedRoute redirige a /consentimiento si `!perfil.consentimientoFirmado`.
- Sede Test no tiene consentimiento de adultos asignado → `/consentimiento/texto`
  devuelve `requerido: false` → Consentimiento parcheaba `consentimientoFirmado: true`
  SOLO en el store del cliente (hack de fc75124) y navegaba a `/`.
- El commit de ayer (3a61dcd) agregó `fetchPerfil()` al montar Home → el refetch
  trae `consentimientoFirmado: false` del server, pisa el parche → loop infinito.

## Causa raíz
El guard depende de un flag por-alumno (`consentimientoFirmado`) sin saber si la
sede requiere consentimiento. El server nunca informó "requerido".

## Plan
- [x] Backend (Clicnet, worktree desde origin/main): perfil GET devuelve
      `consentimientoRequerido` (la sede del alumno tiene ConsentimientoSede).
- [x] Webapp types: `consentimientoRequerido?: boolean` en Perfil.
- [x] Webapp store auth: flag de sesión `consentimientoNoRequerido` (no vive en
      perfil → un refetch no lo pisa). Reset en login/logout.
- [x] Webapp ProtectedRoute: redirigir solo si requerido !== false && !firmado
      && !consentimientoNoRequerido.
- [x] Webapp Consentimiento: en rama `requerido: false` setear el flag de sesión
      (en vez de falsificar consentimientoFirmado).
- [x] Verificar: tsc/build webapp OK, tsc Clicnet worktree OK (prisma generate
      propio del worktree).

## Review
Matriz de casos (webapp nueva):
- Backend nuevo + sede sin consent (menor en Sede Test): perfil trae
  `consentimientoRequerido: false` → ProtectedRoute nunca redirige. Sin bounce.
- Backend viejo + sede sin consent: 1 bounce a /consentimiento → texto
  `requerido: false` → flag de sesión → home estable aunque Home refetchee perfil.
- Sede con consent, no firmado: redirige al form como siempre; al firmar,
  fetchPerfil trae firmado=true → home.
- Logout/login: flag de sesión se resetea (otro usuario en otro device/sede
  no hereda el bypass).
Backend: cambio aditivo en GET /perfil (branch fix/perfil-consentimiento-requerido
en worktree C:\Users\nico-\Clicnet-wt-consent). No rompe la app mobile (campo nuevo).

# Feature: autorización de menores obligatoria (gate post-consentimiento)

## Requerimiento (cambió respecto a ayer)
Igual que el consentimiento: después de firmarlo, un menor NO puede usar la app
hasta ENVIAR la autorización. PENDIENTE (en revisión) y APROBADA no bloquean.

## Implementación
- [x] ProtectedRoute: prop `requireAutorizacionMenores` (default true). Bloquea si
      `autorizacionMenoresRequerido && (RECHAZADA || (estado null && !firmado))`.
      Legacy (firmado del flujo viejo, sin estado) no bloquea. Orden: consent → menores.
- [x] App.tsx: ruta standalone `/autorizacion-menores` (mismo componente
      AutorizacionMenoresForm) en grupo con `requireAutorizacionMenores={false}`
      (y consent requerido → orden correcto). Grupo de /consentimiento también
      exento de menores (evita loop cruzado). Rutas /perfil/... quedan gateadas.
- [x] AutorizacionMenoresForm: `await fetchPerfil()` ANTES de cada navigate
      (lección del loop: el gate lee el store; navegar con datos viejos rebota).
      Modo gate (pathname): sin botón volver, padding propio, tag "Antes de empezar".
- [x] Home: se elimina el CTA no bloqueante (inalcanzable con el gate); queda el
      fetchPerfil en load() que alimenta el gate si rechazan en sesión.
- [x] Copys actualizados ("no bloquea reservas" ya no es cierto).
- [x] tsc + build OK.
