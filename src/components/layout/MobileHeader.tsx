import { useAuth } from '../../store/auth';
import { useBrand } from '../../brand/context';
import SedeSelector from './SedeSelector';

export default function MobileHeader() {
  const perfil = useAuth((s) => s.perfil);
  const brand = useBrand();
  const initial = (perfil?.nombre ?? '?').charAt(0).toUpperCase();

  return (
    <header className="mobile-header">
      <img src={brand.logos.logoBlack} alt={brand.text.fullName} className="mobile-header-logo" />
      <div className="mobile-header-right">
        <SedeSelector variant="header" />
        <div className="mobile-header-avatar">{initial}</div>
      </div>
    </header>
  );
}
