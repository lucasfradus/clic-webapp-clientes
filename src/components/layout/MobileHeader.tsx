import logoBlack from '../../assets/clic_logo_black_transparent.png';
import { useAuth } from '../../store/auth';

export default function MobileHeader() {
  const perfil = useAuth((s) => s.perfil);
  const initial = (perfil?.nombre ?? '?').charAt(0).toUpperCase();

  return (
    <header className="mobile-header">
      <img src={logoBlack} alt="CLIC" className="mobile-header-logo" />
      <div className="mobile-header-avatar">{initial}</div>
    </header>
  );
}
