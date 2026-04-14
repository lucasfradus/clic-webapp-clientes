import { useToast } from '../../store/toast';
import './Toaster.css';

export default function Toaster() {
  const items = useToast((s) => s.items);
  const hide = useToast((s) => s.hide);

  return (
    <div className="toaster">
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => hide(t.id)}
          className={'toast toast-' + t.type}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
