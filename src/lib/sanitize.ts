import DOMPurify from 'dompurify';

// HTML que viene del backend (textos legales, novedades) se sanitiza antes de
// inyectarse con dangerouslySetInnerHTML: defensa en profundidad contra XSS
// almacenado (el JWT vive en localStorage).
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
