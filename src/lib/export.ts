import type { Order } from '../types';
import { rupiah, payLabel, stageLabel } from './domain';
import { CONFIG } from './config';

export function formatExport(orders: Order[]): string {
  const groups = new Map<string, Order[]>();

  for (const o of orders) {
    if (!groups.has(o.date)) groups.set(o.date, []);
    groups.get(o.date)!.push(o);
  }

  const sorted = Array.from(groups.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  const lines: string[] = [];
  for (const [date, group] of sorted) {
    lines.push(`${formatDateLabel(date)}`);
    for (const o of group) {
      lines.push(
        `${o.name} - ${o.design || '-'} (${rupiah(o.price)}) (${payLabel(o.pay)} | ${stageLabel(o.stage)})`
      );
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00+07:00');
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: CONFIG.TZ_NAME,
  });
}
