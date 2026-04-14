import { NavLink } from 'react-router-dom';
import logoWhite from '../../assets/clic_logo_white_transparent.png';
import { useAuth } from '../../store/auth';
import './Sidebar.css';

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/agenda', label: 'Agenda' },
  { to: '/cuenta', label: 'Mi cuenta' },
  { to: '/perfil', label: 'Perfil' },
  { to: '/novedades', label: 'Novedades' },
];

export default function Sidebar() {
  const perfil = useAuth((s) => s.perfil);
  const initial = (perfil?.nombre ?? '?').charAt(0).toUpperCase();
  const fullName = perfil
    ? `${perfil.nombre} ${perfil.apellido}`.trim()
    : '—';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={logoWhite} alt="CLIC" className="sidebar-logo" />
        <span className="sidebar-tagline italiana">studio pilates</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              'sidebar-item' + (isActive ? ' active' : '')
            }
          >
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <NavLink to="/perfil" className="sidebar-footer">
        <div className="sidebar-avatar">{initial}</div>
        <div className="sidebar-user">
          <div className="sidebar-user-name">{fullName}</div>
          <div className="sidebar-user-link">Ver perfil →</div>
        </div>
      </NavLink>
    </aside>
  );
}
