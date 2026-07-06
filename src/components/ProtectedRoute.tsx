import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/auth';

interface Props {
  requireConsent?: boolean;
}

export default function ProtectedRoute({ requireConsent = true }: Props) {
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

  return <Outlet />;
}
