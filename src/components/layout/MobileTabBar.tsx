import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Home', end: true },
  { to: '/agenda', label: 'Agenda' },
  { to: '/cuenta', label: 'Cuenta' },
  { to: '/perfil', label: 'Perfil' },
  { to: '/novedades', label: 'News' },
];

export default function MobileTabBar() {
  return (
    <nav className="mobile-bar">
      {tabs.map((t) => (
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
