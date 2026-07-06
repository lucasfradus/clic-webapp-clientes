# Feature: Autorización de menores — nuevo flujo (foto DNI del tutor)

## Contexto
El backend (ClicNet) cambió el flujo. Ya NO bloquea nada: es autogestión + registro,
se comporta como el consentimiento pero sin gate de ruta. El artefacto clave es una
FOTO del DNI del tutor (data URI base64), no una firma dibujada.
Estados (`autorizacionMenoresEstado`): null → PENDIENTE → APROBADA | RECHAZADA (reenviable).

## Reglas clave
- NUNCA bloquear reservas por este flujo (no tocar ProtectedRoute ni reservas).
- `requerido === false` (flag de sede) → no mostrar nada del flujo.
- Reenviar solo con estado null o RECHAZADA; PENDIENTE/APROBADA no ofrecen reenvío.
- POST único con: firma (texto), documento (data URI), version (de /texto),
  tutorNombre/Apellido/Dni/Contacto/Relacion (PADRE|MADRE|TUTOR).

## Plan
- [x] Leer código actual (patrón consentimiento, perfil, home, client, types)
- [x] types/index.ts: AutorizacionMenoresEstado, TutorRelacion, campos nuevos en Perfil,
      AutorizacionMenoresTexto, AutorizacionMenoresFirmado, EnviarAutorizacionMenoresBody
- [x] api/autorizacionMenores.ts: getTexto (sin auth), getFirmado (auth), enviar (auth)
- [x] lib/image.ts: File → data URI JPEG comprimido (canvas, max ~1600px, q 0.82)
- [x] pages/AutorizacionMenores.tsx (ruta /perfil/autorizacion-menores): refleja /firmado —
      no enviada (CTA completar) · PENDIENTE (en revisión, sin reenvío) · APROBADA (ok) ·
      RECHAZADA (motivo + CTA reenviar) · requerido=false (no aplica)
- [x] pages/AutorizacionMenoresForm.tsx (ruta /perfil/autorizacion-menores/enviar):
      texto legal + datos tutor + relación pills + foto DNI + aceptación → un POST.
      Redirige a la página de estado si PENDIENTE/APROBADA.
- [x] App.tsx: 2 rutas nuevas dentro del área protegida con AppLayout (NO bloqueante)
- [x] Perfil.tsx: item de menú "Autorización de menores" solo si requerido
- [x] Home.tsx: aviso/CTA no bloqueante si requerido y estado null|RECHAZADA;
      refrescar perfil en load() para mantener el aviso al día
- [x] npm run build (tsc -b + vite) verde
- [x] Review adversarial del diff (workflow, 4 lentes + verificación) + hallazgos aplicados

## Review
Hecho. Build verde (tsc -b + vite). Review multi-agente: 8 hallazgos, 5 confirmados,
3 refutados (uno verificado contra el código real de ClicNet, otro empíricamente en
Chrome headless). Todos los confirmados aplicados:

1. (media) Guard del form usaba `perfil` cacheado del store mientras la página de
   estado usa `/firmado` fresco → botón "Volver a enviar" podía morir en un loop de
   redirect silencioso tras un rechazo a mitad de sesión. Fix: el form ahora consulta
   `GET /firmado` fresco al montar (junto con `/texto`) y decide el guard con eso;
   el motivo de rechazo también sale de ahí, no del store.
2. (baja) Sin retry si fallaba GET /texto o /firmado → botón "Reintentar" en ambas
   páginas (mismo patrón que Novedades).
3. (baja) `await fetchPerfil()` tras el POST retrasaba el toast/navegación → ahora
   fire-and-forget (la página de estado consulta /firmado por su cuenta).
4. (baja) `dangerouslySetInnerHTML` sin sanitizar (y /texto es sin auth) → se agregó
   DOMPurify con helper compartido `lib/sanitize.ts`, aplicado a los 4 sinks del repo
   (form nuevo, Consentimiento, Politicas, Novedades). JWT en localStorage era exfiltrable
   ante XSS almacenado.
Extra: la página de estado hace `fetchPerfil()` best-effort al montar para que el
aviso de Home refleje aprobaciones/rechazos hechos desde recepción; se quitó
`capture="environment"` del input de foto (iOS forzaba cámara sin opción de galería).

Refutados (no aplicados): CTA con `!firmado` (equivalente por invariante del backend,
igual se alineó el predicado a `estado == null || RECHAZADA` por claridad); SVG 0x0 →
JPEG 1x1 (falso en engines vigentes); copy de "sede no requiere" para mayores (contrato
documentado dice que `requerido` es flag de sede).

Pendiente de QA manual (requiere backend + cuenta de menor): flujo completo de envío
con foto real contra staging.
