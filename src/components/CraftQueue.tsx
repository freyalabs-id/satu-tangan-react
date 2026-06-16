import { memo } from 'react';
import { CONFIG } from '../lib/config';
import { craftBy } from '../lib/domain';
import type { Order, Settings } from '../types';

interface Props {
  orders?: Order[];
  settings?: Settings;
  onEditOrder?: (order: Order) => void;
}

const CraftQueue = memo(function CraftQueue({ orders = [], settings, onEditOrder }: Props) {
  const lead = settings?.lead ?? CONFIG.DEFAULT_LEAD;
  const horizon = CONFIG.QUEUE_HORIZON;

  const now = Date.now();
  const cutoff = new Date(now + horizon * 3600000);

  const items = orders
    .filter((o) => o.stage !== 'Done' && o.stage !== 'Out')
    .map((o) => {
      const cb = craftBy(o, lead);
      const delivery = new Date(cb.getTime() + lead * 3600000);
      const overdue = cb.getTime() < now;
      return { order: o, craftBy: cb, delivery, overdue };
    })
    .filter((item) => item.craftBy.getTime() <= cutoff.getTime())
    .sort((a, b) => a.craftBy.getTime() - b.craftBy.getTime());

  function fmtCraftTime(cb: Date) {
    return cb.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  function fmtDelivery(delivery: Date) {
    const time = delivery.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    const date = delivery.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }).toUpperCase();
    return `kirim ${time} ${date}`;
  }

  if (items.length === 0) {
    return <p className="text-[13px] text-soft py-2 font-mono">Belum ada selanjutnya. Istirahat dulu.</p>;
  }

  return (
    <div className="flex flex-col gap-0">
      {items.map((item, idx) => (
        <button
          key={item.order.id}
          className="flex items-center gap-3 py-2.5 border-t border-line cursor-pointer text-left bg-transparent border-0 w-full hover:bg-line/10 transition-colors"
          onClick={() => onEditOrder?.(item.order)}
        >
          <span className="font-mono text-[12px] text-soft/60 w-5 shrink-0 select-none">{String(idx + 1).padStart(2, '0')}</span>
          <span className={`font-mono font-semibold text-[13px] w-[68px] shrink-0 ${item.overdue ? 'text-g3' : 'text-ink'}`}>
            {fmtCraftTime(item.craftBy)}
          </span>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-[14px] text-ink block truncate">{item.order.name}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[12px] text-soft truncate">{item.order.design || '-'}</span>
              <span className="text-[11px] text-soft/70 font-mono shrink-0 truncate">{fmtDelivery(item.delivery)}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
});
export default CraftQueue;
