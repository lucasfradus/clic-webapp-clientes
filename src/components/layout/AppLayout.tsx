import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import MobileTabBar from './MobileTabBar';
import { getNovedades } from '../../api/novedades';
import { getLastSeenNovedadId } from '../../lib/novedadesLeidas';
import { useAuth } from '../../store/auth';
import './AppLayout.css';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const alumnoId = useAuth((s) => s.user?.alumnoId);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    if (!alumnoId) return;
    // No interrumpir si el alumno ya esta en /novedades.
    if (location.pathname === '/novedades') {
      checkedRef.current = true;
      return;
    }
    checkedRef.current = true;
    (async () => {
      try {
        const novedades = await getNovedades();
        if (novedades.length === 0) return;
        const lastSeen = getLastSeenNovedadId(alumnoId);
        const hayNoLeidas = novedades.some((n) => n.id > lastSeen);
        if (hayNoLeidas) navigate('/novedades', { replace: true });
      } catch {
        // No bloquear la UX si falla la API — el alumno entra normal.
      }
    })();
  }, [alumnoId, location.pathname, navigate]);

  return (
    <div className="app-shell">
      <Sidebar />
      <MobileHeader />
      <main className="app-main">
        <div className="app-main-inner">
          <Outlet />
        </div>
      </main>
      <MobileTabBar />
    </div>
  );
}
