import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/auth';

interface Props {
  requireConsent?: boolean;
}

export default function ProtectedRoute({ requireConsent = true }: Props) {
  const token = useAuth((s) => s.token);
  const perfil = useAuth((s) => s.perfil);

  if (!token) return <Navigate to="/login" replace />;

  // Esperar bootstrap
  if (!perfil) return <div className="full-loader">Cargando…</div>;

  if (requireConsent && !perfil.consentimientoFirmado) {
    return <Navigate to="/consentimiento" replace />;
  }

  return <Outlet />;
}
