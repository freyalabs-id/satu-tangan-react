import { useState, useCallback, useRef } from 'react';

interface Action {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
  action: Action | null;
}

const MAX_QUEUE = 5;

export function useToast() {
  const [current, setCurrent] = useState<ToastItem | null>(null);
  const queueRef = useRef<ToastItem[]>([]);
  const activeRef = useRef(false);
  const idRef = useRef(0);

  const advance = useCallback(() => {
    const next = queueRef.current.shift();
    if (next) {
      setCurrent(next);
    } else {
      activeRef.current = false;
    }
  }, []);

  const toast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info', action: Action | null = null) => {
    const item: ToastItem = { id: idRef.current++, message, type, action };
    if (!activeRef.current) {
      activeRef.current = true;
      setCurrent(item);
    } else {
      if (queueRef.current.length >= MAX_QUEUE) queueRef.current.shift();
      queueRef.current.push(item);
    }
  }, []);

  const closeToast = useCallback(() => {
    setCurrent(null);
    setTimeout(advance, 200);
  }, [advance]);

  const toastState = current
    ? { message: current.message, type: current.type, show: true, action: current.action }
    : { message: '', type: 'info' as const, show: false, action: null };

  return { toast, closeToast, toastState };
}
