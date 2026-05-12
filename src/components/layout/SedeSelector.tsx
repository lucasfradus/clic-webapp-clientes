import { useEffect, useRef, useState } from 'react';
import { useSede, useSelectedSede } from '../../store/sede';
import './SedeSelector.css';

interface Props {
  variant?: 'header' | 'sidebar';
}

export default function SedeSelector({ variant = 'header' }: Props) {
  const sedes = useSede((s) => s.sedes);
  const setSelectedSedeId = useSede((s) => s.setSelectedSedeId);
  const selected = useSelectedSede();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  if (sedes.length <= 1) {
    // Una sola sede accesible: no hay nada que elegir
    return selected ? (
      <div className={`sede-selector sede-selector--${variant} sede-selector--static`}>
        <span className="sede-selector-icon">📍</span>
        <span className="sede-selector-label">{selected.nombre}</span>
      </div>
    ) : null;
  }

  const isVisitor = selected && !selected.esHome;

  return (
    <div className={`sede-selector sede-selector--${variant}`} ref={ref}>
      <button
        type="button"
        className={'sede-selector-trigger' + (isVisitor ? ' visitor' : '')}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="sede-selector-icon">📍</span>
        <span className="sede-selector-label">
          {selected?.nombre ?? 'Elegí sede'}
        </span>
        {isVisitor && <span className="sede-selector-badge">VISITANTE</span>}
        <span className="sede-selector-caret">⌄</span>
      </button>

      {open && (
        <div className="sede-selector-menu" role="listbox">
          {sedes.map((s) => (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={s.id === selected?.id}
              className={
                'sede-selector-item' +
                (s.id === selected?.id ? ' active' : '')
              }
              onClick={() => {
                setSelectedSedeId(s.id);
                setOpen(false);
              }}
            >
              <span>{s.nombre}</span>
              {!s.esHome && <span className="sede-selector-hint">(visitante)</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
