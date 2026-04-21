import { useBrand } from '../../brand/context';

type Color = 'white' | 'black' | 'accent';

interface Props {
  color?: Color;
  size?: number;
  opacity?: number;
  position?: { bottom?: number; right?: number; top?: number; left?: number };
  inline?: boolean;
}

export default function Watermark({
  color = 'white',
  size = 180,
  opacity = 0.07,
  position = { bottom: -24, right: -24 },
  inline = false,
}: Props) {
  const { logos } = useBrand();
  const srcMap: Record<Color, string> = {
    white: logos.isoWhite,
    black: logos.isoBlack,
    accent: logos.isoAccent,
  };

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
