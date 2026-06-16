import { memo } from 'react';
import { CONFIG } from '../lib/config';
import { deliveryLoad, isToday } from '../lib/domain';
import BalloonGauge from './BalloonGauge';
import OrderCard from './OrderCard';
import type { Order, Settings } from '../types';

interface Props {
  orders?: Order[];
  settings?: Settings;
  onEditOrder?: (order: Order) => void;
  onPayCycle?: (id: string) => void;
  onStageAdvance?: (id: string) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onLongPress?: (id: string) => void;
}

const DaysView = memo(function DaysView({ orders = [], settings, onEditOrder, onPayCycle, onStageAdvance, selectionMode, selectedIds, onToggleSelect, onLongPress }: Props) {
  const cap = settings?.cap ?? CONFIG.DEFAULT_CAP;

  const map = new Map<string, { date: string; orders: Order[]; load: number; cap: number }>();

  for (const o of orders) {
    if (o.stage === 'Done') continue;
    const dt = o.date;
    if (!map.has(dt)) {
      map.set(dt, { date: dt, orders: [], load: 0, cap });
    }
    map.get(dt)!.orders.push(o);
  }

  for (const [dateStr, day] of map) {
    day.load = deliveryLoad(dateStr, orders);
  }

  const days = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));

  function dayLabel(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00+07:00');
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', timeZone: CONFIG.TZ_NAME }).toUpperCase();
  }

  if (days.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[12px] text-soft font-mono mb-1">Belum ada pesanan.</p>
        <p className="text-[11px] text-soft/60 font-mono">Tekan <span className="text-pop">+ Pesanan baru</span> untuk mulai.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 my-3">
      {days.map((day) => (
        <div key={day.date} className="bg-surface border border-line rounded-xl p-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-mono text-[11px] tracking-[0.12em] uppercase text-soft m-0 flex items-center gap-1.5">
              {isToday(day.date) && <span className="w-1.5 h-1.5 rounded-full bg-g2/60 shrink-0" />}
              {dayLabel(day.date)}
            </h3>
            <span className="font-mono text-[11px] text-soft">{day.orders.length} pesanan</span>
          </div>
          <BalloonGauge load={day.load} cap={day.cap} />
          <div className="flex flex-col gap-1.5 mt-2.5">
            {day.orders.map((order) => (
              <OrderCard key={order.id} order={order} onEdit={onEditOrder} onStageAdvance={onStageAdvance} onPayCycle={onPayCycle} selectionMode={selectionMode} selected={selectedIds?.has(order.id)} onToggleSelect={onToggleSelect} onLongPress={onLongPress} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

export default DaysView;
