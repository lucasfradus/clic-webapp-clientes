import { useAuth } from '../../store/auth';
import { useBrand } from '../../brand/context';
import Avatar from '../ui/Avatar';
import SedeSelector from './SedeSelector';

export default function MobileHeader() {
  const perfil = useAuth((s) => s.perfil);
  const brand = useBrand();

  return (
    <header className="mobile-header">
      <img src={brand.logos.logoBlack} alt={brand.text.fullName} className="mobile-header-logo" />
      <div className="mobile-header-right">
        <SedeSelector variant="header" />
        <Avatar
          className="mobile-header-avatar"
          fotoUrl={perfil?.fotoUrl}
          nombre={perfil?.nombre}
        />
      </div>
    </header>
  );
}
