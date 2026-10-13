import { NavLink } from 'react-router-dom';
import { useAuth } from '../../store/auth';

const tabs = [
  { to: '/', label: 'Home', end: true },
  { to: '/agenda', label: 'Agenda' },
  { to: '/cuenta', label: 'Cuenta' },
  { to: '/perfil', label: 'Perfil' },
  { to: '/novedades', label: 'News' },
];

export default function MobileTabBar() {
  const musculacion = useAuth((s) => s.perfil?.musculacionDisponible);
  // Con musculación, "News" deja lugar a "Rutina": no entran seis pestañas. Las
  // novedades siguen a mano desde el Home y se abren solas si hay sin leer.
  const visibles = musculacion
    ? tabs.map((t) => (t.to === '/novedades' ? { to: '/rutina', label: 'Rutina' } : t))
    : tabs;
  return (
    <nav className="mobile-bar">
      {visibles.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            'mobile-tab' + (isActive ? ' active' : '')
          }
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
