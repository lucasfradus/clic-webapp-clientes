import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/auth';

interface Props {
  requireConsent?: boolean;
  requireAutorizacionMenores?: boolean;
}

export default function ProtectedRoute({
  requireConsent = true,
  requireAutorizacionMenores = true,
}: Props) {
  const token = useAuth((s) => s.token);
  const perfil = useAuth((s) => s.perfil);
  const consentimientoNoRequerido = useAuth((s) => s.consentimientoNoRequerido);

  if (!token) return <Navigate to="/login" replace />;

  // Esperar bootstrap
  if (!perfil) return <div className="full-loader">Cargando…</div>;

  // consentimientoRequerido !== false: backends viejos no mandan el campo
  if (
    requireConsent &&
    perfil.consentimientoRequerido !== false &&
    !perfil.consentimientoFirmado &&
    !consentimientoNoRequerido
  ) {
    return <Navigate to="/consentimiento" replace />;
  }

  // Menores: obligatorio después del consentimiento. Bloquea si nunca se envió
  // o fue rechazada; PENDIENTE y APROBADA no bloquean (la revisión es del
  // estudio). Legacy: firmado del flujo viejo sin estado tampoco bloquea.
  const faltaAutorizacionMenores =
    perfil.autorizacionMenoresRequerido === true &&
    (perfil.autorizacionMenoresEstado === 'RECHAZADA' ||
      (perfil.autorizacionMenoresEstado == null &&
        !perfil.autorizacionMenoresFirmado));

  if (requireAutorizacionMenores && faltaAutorizacionMenores) {
    return <Navigate to="/autorizacion-menores" replace />;
  }

  return <Outlet />;
}
