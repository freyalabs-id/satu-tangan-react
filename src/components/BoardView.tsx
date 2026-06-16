import { memo } from 'react';
import { CONFIG } from '../lib/config';
import { stageLabel } from '../lib/domain';
import OrderCard from './OrderCard';
import type { Order } from '../types';

interface Props {
  orders?: Order[];
  onStageAdvance?: (id: string) => void;
  onPayCycle?: (id: string) => void;
  onEditOrder?: (order: Order) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onLongPress?: (id: string) => void;
}

const BoardView = memo(function BoardView({ orders = [], onStageAdvance, onPayCycle, onEditOrder, selectionMode, selectedIds, onToggleSelect, onLongPress }: Props) {
  const stages = CONFIG.STAGES.map((stage) => {
    const items = orders.filter((o) => o.stage === stage);
    return { stage, items, count: items.length, label: stageLabel(stage) };
  });

  const allEmpty = stages.every((c) => c.count === 0);

  if (allEmpty) {
    return (
      <div className="text-center py-8">
        <p className="text-[12px] text-soft font-mono mb-1">Belum ada pesanan.</p>
        <p className="text-[11px] text-soft/60 font-mono">Tekan <span className="text-pop">+ Pesanan baru</span> untuk mulai.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto py-2 pb-3 scroll-snap-x-mandatory">
      {stages.map((col) => (
        <div key={col.stage} className="flex-[0_0_240px] snap-start border border-line rounded-xl p-1 px-3 pb-2.5 min-h-[110px]">
          <div className="flex justify-between items-center py-3 px-0.5 border-b border-line">
            <h3 className="font-mono text-[11px] tracking-[0.12em] uppercase text-soft m-0">{col.label}</h3>
            <span className="font-mono text-[11px] text-soft">{col.count}</span>
          </div>
          {col.items.length === 0 ? (
            <p className="text-[12px] text-soft font-mono py-3">&nbsp;</p>
          ) : (
            <div className="flex flex-col gap-1.5 mt-2">
              {col.items.map((order) => (
                <OrderCard key={order.id} order={order} onEdit={onEditOrder} onStageAdvance={onStageAdvance} onPayCycle={onPayCycle} selectionMode={selectionMode} selected={selectedIds?.has(order.id)} onToggleSelect={onToggleSelect} onLongPress={onLongPress} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});
export default BoardView;
