export {};

// Los usuarios estan en Argentina (UTC-3) y ahi es donde se manifiesta el
// corrimiento de las fechas de calendario. Fijar la TZ hace que los tests den
// lo mismo en la maquina de cualquiera y en CI.
// `process` se declara local en vez de sumar @types/node: es lo unico que el
// proyecto necesita de Node y no conviene exponer sus globals al codigo del browser.
declare const process: { env: Record<string, string | undefined> };

process.env.TZ = 'America/Argentina/Buenos_Aires';
