import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Sheet({ title, onClose, children }: Props) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-bg/90" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-[540px] mx-auto bg-surface border-t border-line rounded-t-2xl px-4 pt-4 pb-[max(20px,env(safe-area-inset-bottom))] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-[19px] tracking-[-0.02em] m-0">{title}</h2>
          <button className="border border-line rounded-xl w-[44px] h-[44px] grid place-items-center cursor-pointer bg-transparent text-ink text-lg" onClick={onClose}>&times;</button>
        </div>
        {children}
      </div>
    </>
  );
}
