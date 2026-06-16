import { useState, useCallback } from 'react';

export interface SelectionState {
  active: boolean;
  selected: Set<string>;
  toggle: (id: string) => void;
  enter: (initialId?: string) => void;
  exit: () => void;
}

export function useSelectionMode(): SelectionState {
  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const enter = useCallback((initialId?: string) => {
    setActive(true);
    setSelected(initialId ? new Set([initialId]) : new Set());
  }, []);

  const exit = useCallback(() => {
    setActive(false);
    setSelected(new Set());
  }, []);

  return { active, selected, toggle, enter, exit };
}
