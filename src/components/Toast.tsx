import { useEffect, useRef, useState } from 'react';

interface Action {
  label: string;
  onClick: () => void;
}

interface Props {
  message: string;
  type?: 'info' | 'success' | 'error';
  show?: boolean;
  action?: Action | null;
  onClose?: () => void;
}

export default function Toast({ message, type = 'info', show = false, action = null, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const pausedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (show) {
      setVisible(true);
      pausedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!pausedRef.current) {
          setVisible(false);
          setTimeout(() => onClose?.(), 300);
        }
      }, 2500);
    } else {
      setVisible(false);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [show]);

  function handleMouseEnter() {
    pausedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  function handleMouseLeave() {
    pausedRef.current = false;
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, 1500);
  }

  const bgClass =
    type === 'error' ? 'bg-g3/20 text-g3 border-g3/30' :
    type === 'success' ? 'bg-g1/20 text-g1 border-g1/30' :
    'bg-line/40 text-ink border-line';

  const icon =
    type === 'success' ? '\u2713' :
    type === 'error' ? '\u2717' : '';

  if (!show) return null;

  return (
    <div
      className={`fixed bottom-[100px] left-1/2 -translate-x-1/2 z-[60] max-w-[380px] w-[calc(100%-2rem)] transition-all duration-300 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      role="alert"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`${bgClass} border rounded-xl px-4 py-3 font-mono text-[12px] text-center flex items-center justify-center gap-2`}>
        {icon && <span className="font-semibold text-[12px]" aria-hidden="true">{icon}</span>}
        {message}
        {action && (
          <button
            className="ml-1 border border-current rounded-md px-2 py-0.5 text-[11px] font-semibold cursor-pointer bg-transparent hover:bg-current/10"
            onClick={() => { action.onClick?.(); onClose?.(); }}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
