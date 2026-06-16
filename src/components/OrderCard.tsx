import { useRef, useCallback, memo } from 'react';
import { CONFIG } from '../lib/config';
import { waLink, stageLabel, payLabel } from '../lib/domain';
import type { Order } from '../types';

interface Props {
  order: Order;
  onEdit?: (order: Order) => void;
  onStageAdvance?: (id: string) => void;
  onPayCycle?: (id: string) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onLongPress?: (id: string) => void;
  onToggleSelect?: (id: string) => void;
}

const LONG_PRESS_MS = 500;

const OrderCard = memo(function OrderCard({ order, onEdit, onStageAdvance, onPayCycle, selectionMode, selected, onLongPress, onToggleSelect }: Props) {
  const link = waLink(order.phone);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressedRef = useRef(false);

  const handleTouchStart = useCallback(() => {
    if (selectionMode) return;
    pressedRef.current = false;
    timerRef.current = setTimeout(() => {
      pressedRef.current = true;
      onLongPress?.(order.id);
    }, LONG_PRESS_MS);
  }, [selectionMode, onLongPress, order.id]);

  const handleTouchEnd = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  function handleClick() {
    if (pressedRef.current) {
      pressedRef.current = false;
      return;
    }
    if (selectionMode) {
      onToggleSelect?.(order.id);
    } else {
      onEdit?.(order);
    }
  }

  return (
    <button
      className={`w-full text-left bg-slip border rounded-lg p-3 cursor-pointer hover:border-line2 transition-colors ${selected ? 'border-pop/60 bg-pop/5' : 'border-line'}`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      <div className="flex items-center gap-2">
        {selectionMode && (
          <span className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${selected ? 'border-pop bg-pop' : 'border-soft/40 bg-transparent'}`}>
            {selected && <span className="text-[10px] text-[#1a0a12] font-bold">{'\u2713'}</span>}
          </span>
        )}
        <span className="font-mono text-[13px] text-ink truncate flex-1">{order.name}</span>
        <span className="font-mono text-[11px] text-soft truncate max-w-[200px]">
          {order.design || '\u2014'}
        </span>
        {!selectionMode && link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 w-[44px] h-[44px] rounded-md bg-transparent flex items-center justify-center text-[13px] text-[#4ea870] no-underline hover:bg-line/30"
            onClick={(e) => e.stopPropagation()}
            aria-label="WhatsApp"
          >
            {'\u{1F4AC}'}
          </a>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap overflow-hidden">
        <span className={`text-[11px] px-[5px] py-px rounded font-mono eff-${order.eff}`}>
          {order.eff}
        </span>
        {!selectionMode && (
          <>
            <span
              className="pill border border-line/50 bg-transparent hover:border-ink transition-colors flex items-center gap-1 justify-center w-[84px] shrink-0 truncate"
              style={{ color: CONFIG.STAGE_COLORS[order.stage] || '#8a8278' }}
              onClick={(e) => { e.stopPropagation(); onStageAdvance?.(order.id); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onStageAdvance?.(order.id); } }}
              role="button"
              tabIndex={0}
              aria-label={`Tahap: ${stageLabel(order.stage)}. Ketuk untuk maju.`}
            >
              {stageLabel(order.stage)}
              <span className="text-[10px] shrink-0">&rarr;</span>
            </span>
            <span
              className={`pill border-0 hover:brightness-110 justify-center flex w-[88px] shrink-0 truncate text-center pay-${order.pay}`}
              onClick={(e) => { e.stopPropagation(); onPayCycle?.(order.id); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onPayCycle?.(order.id); } }}
              role="button"
              tabIndex={0}
              aria-label={`Status bayar: ${payLabel(order.pay)}`}
            >
              {payLabel(order.pay)}
            </span>
          </>
        )}
        {selectionMode && (
          <span
            className="text-[11px] px-[6px] py-[3px] rounded-md font-mono border-0"
            style={{ color: CONFIG.STAGE_COLORS[order.stage] || '#8a8278' }}
          >
            {stageLabel(order.stage)}
          </span>
        )}
      </div>
    </button>
  );
});
export default OrderCard;
