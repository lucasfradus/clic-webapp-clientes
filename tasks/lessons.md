# Lessons

## Parches client-side al estado del servidor no sobreviven refetches
- Qué pasó: el fix del loop / ↔ /consentimiento (fc75124) falsificaba
  `perfil.consentimientoFirmado: true` en el store. Meses después, Home agregó
  `fetchPerfil()` al montar (feature de autorización de menores) y el refetch
  pisó el parche → loop infinito de vuelta.
- Regla: nunca "corregir" en el store un campo que viene del servidor. Si el
  server no informa algo (ej: "la sede no requiere consentimiento"), agregarlo
  al endpoint o guardarlo en estado propio del cliente separado del objeto
  fetcheado.
- Regla: guards de ruta deben depender de la verdad del servidor, no de un flag
  derivado que el cliente pueda desincronizar.

## Antes de diagnosticar un bug "de ayer": fetch en TODOS los repos
- Qué pasó: los cambios de ayer no estaban en el working tree local (webapp 2
  commits atrás de origin; Clicnet también atrás). El código que corría en prod
  solo estaba en origin/main.
- Regla: ante un bug reportado sobre trabajo reciente, correr `git fetch` y
  mirar origin/main en webapp Y en Clicnet antes de razonar sobre el código local.
