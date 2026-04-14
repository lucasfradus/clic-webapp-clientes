import isoWhite from '../../assets/clic_iso_white_transparent.png';
import isoBlack from '../../assets/clic_iso_black_transparent.png';
import isoTaupe from '../../assets/clic_iso_taupe_transparent.png';

type Color = 'white' | 'black' | 'taupe';

interface Props {
  color?: Color;
  size?: number;
  opacity?: number;
  position?: { bottom?: number; right?: number; top?: number; left?: number };
  inline?: boolean;
}

const srcMap: Record<Color, string> = {
  white: isoWhite,
  black: isoBlack,
  taupe: isoTaupe,
};

export default function Watermark({
  color = 'white',
  size = 180,
  opacity = 0.07,
  position = { bottom: -24, right: -24 },
  inline = false,
}: Props) {
  if (inline) {
    return (
      <img
        src={srcMap[color]}
        alt=""
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
    );
  }
  return (
    <img
      src={srcMap[color]}
      alt=""
      style={{
        position: 'absolute',
        width: size,
        height: size,
        objectFit: 'contain',
        opacity,
        pointerEvents: 'none',
        zIndex: 0,
        ...position,
      }}
    />
  );
}
