// Avatar del cliente: muestra la foto de perfil si existe, o la inicial del nombre.
// `fotoUrl` puede ser una URL (/api/storage/...) o un data URI; ambos van directo al <img>.
// Reutiliza las clases contenedoras existentes (.perfil-avatar, .mobile-header-avatar,
// .sidebar-avatar) pasándolas por `className`, así respeta tamaño/estilo de cada lugar.
export default function Avatar({
  fotoUrl,
  nombre,
  className,
}: {
  fotoUrl?: string | null;
  nombre?: string | null;
  className?: string;
}) {
  const initial = (nombre ?? '?').charAt(0).toUpperCase();
  return (
    <div className={className}>
      {fotoUrl ? <img src={fotoUrl} alt="" className="avatar-img" /> : initial}
    </div>
  );
}
