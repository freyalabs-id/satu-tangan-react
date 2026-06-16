import type { Order, Effort, Payment, Stage, Settings } from '../types';
import { CONFIG } from './config';

export function toWIB(date: Date): Date {
  return new Date(date.getTime() + CONFIG.TZ_OFFSET * 3600000);
}

export function wibNow(): Date {
  return toWIB(new Date());
}

export function parseDateTime(dateStr: string, timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  return new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+07:00`);
}

export function craftBy(order: Order, lead = CONFIG.DEFAULT_LEAD): Date {
  const delivery = parseDateTime(order.date, order.time);
  return new Date(delivery.getTime() - lead * 3600000);
}

export function craftDateFor(order: { date: string; time: string }, lead = CONFIG.DEFAULT_LEAD): string {
  const cb = craftBy(order as Order, lead);
  const wib = toWIB(cb);
  const y = wib.getUTCFullYear();
  const m = String(wib.getUTCMonth() + 1).padStart(2, '0');
  const d = String(wib.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function deliveryDateFor(order: Order): string {
  return order.date;
}

export function effortWeight(eff: Effort): number {
  return CONFIG.EFFORT[eff] ?? CONFIG.EFFORT.Med;
}

export function dayLoad(craftDate: string, orders: Order[], lead = CONFIG.DEFAULT_LEAD): number {
  let total = 0;
  for (const o of orders) {
    if (o.stage === 'Done') continue;
    if (craftDateFor(o, lead) === craftDate) {
      total += effortWeight(o.eff) * o.qty;
    }
  }
  return total;
}

export function deliveryLoad(deliveryDate: string, orders: Order[]): number {
  let total = 0;
  for (const o of orders) {
    if (o.stage === 'Done') continue;
    if (o.date === deliveryDate) {
      total += effortWeight(o.eff) * o.qty;
    }
  }
  return total;
}

export function projectedLoad(
  craftDate: string, effort: Effort, qty: number, excludeId: string | undefined,
  orders: Order[], lead = CONFIG.DEFAULT_LEAD,
): number {
  let load = 0;
  for (const o of orders) {
    if (o.id === excludeId) continue;
    if (o.stage === 'Done') continue;
    if (craftDateFor(o, lead) === craftDate) {
      load += effortWeight(o.eff) * o.qty;
    }
  }
  return load + effortWeight(effort) * qty;
}

export function queue(nowMs: number, orders: Order[], settings?: Settings) {
  const lead = settings?.lead ?? CONFIG.DEFAULT_LEAD;
  const horizon = CONFIG.QUEUE_HORIZON;
  const now = new Date(nowMs);
  const cutoff = new Date(now.getTime() + horizon * 3600000);

  return orders
    .filter((o) => o.stage !== 'Done')
    .map((o) => ({ order: o, craftBy: craftBy(o, lead) }))
    .filter((item) => item.craftBy <= cutoff)
    .sort((a, b) => a.craftBy.getTime() - b.craftBy.getTime());
}

export function rupiah(n: number): string {
  if (typeof n !== 'number' || !Number.isInteger(n)) return 'Rp 0';
  return `Rp ${n.toLocaleString('id-ID')}`;
}

export function waLink(phone: string): string | null {
  if (!phone) return null;
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (!cleaned) return null;
  if (cleaned.startsWith('0')) cleaned = CONFIG.WA_COUNTRY_CODE + cleaned.slice(1);
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
  if (!cleaned.startsWith(CONFIG.WA_COUNTRY_CODE)) cleaned = CONFIG.WA_COUNTRY_CODE + cleaned;
  return `https://wa.me/${cleaned}`;
}

export function cyclePayment(pay: Payment): Payment {
  const idx = CONFIG.PAYMENTS.indexOf(pay);
  if (idx === -1) return CONFIG.PAYMENTS[0];
  return CONFIG.PAYMENTS[(idx + 1) % CONFIG.PAYMENTS.length];
}

const STAGE_LABEL: Record<string, string> = { Confirmed: 'OK', Crafting: 'Buat', Out: 'Kirim', Done: 'Selesai' };
const PAY_LABEL: Record<string, string> = { Unpaid: 'Belum Bayar', DP: 'DP', Lunas: 'Lunas' };

export function stageLabel(stage: string): string {
  return STAGE_LABEL[stage] || stage;
}

export function payLabel(pay: string): string {
  return PAY_LABEL[pay] || pay;
}

export function advanceStage(stage: Stage, pay: Payment): Stage | null {
  const idx = CONFIG.STAGES.indexOf(stage);
  if (idx === -1 || idx === CONFIG.STAGES.length - 1) return stage;
  const next = CONFIG.STAGES[idx + 1];
  if (next === 'Done' && pay !== 'Lunas') return null;
  return next;
}

export function createOrderData(data: Partial<Order>): Omit<Order, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: data.name ?? '',
    phone: data.phone ?? '',
    design: data.design ?? '',
    eff: (data.eff && data.eff in CONFIG.EFFORT ? data.eff : 'Med') as Effort,
    qty: 1,
    price: Math.max(0, parseInt(String(data.price)) || 0),
    date: data.date ?? '',
    time: data.time ?? '12:00',
    addr: data.addr ?? '',
    pay: (data.pay && CONFIG.PAYMENTS.includes(data.pay) ? data.pay : 'Unpaid') as Payment,
    stage: (data.stage && CONFIG.STAGES.includes(data.stage) ? data.stage : 'Confirmed') as Stage,
    notes: data.notes ?? '',
  };
}

export function isOverBudget(
  craftDate: string, effort: Effort, qty: number, excludeId: string | undefined,
  orders: Order[], cap?: number, lead = CONFIG.DEFAULT_LEAD,
): boolean {
  const budget = cap ?? CONFIG.DEFAULT_CAP;
  return projectedLoad(craftDate, effort, qty, excludeId, orders, lead) > budget;
}

export function todayDateStr(): string {
  const fmt = new Intl.DateTimeFormat('id-ID', {
    timeZone: CONFIG.TZ_NAME,
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const parts = fmt.formatToParts(new Date());
  return `${parts.find((p) => p.type === 'year')!.value}-${parts.find((p) => p.type === 'month')!.value}-${parts.find((p) => p.type === 'day')!.value}`;
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayDateStr();
}

export function todayStats(orders: Order[], settings?: Settings) {
  const todayStr = todayDateStr();

  let todayLoad = 0;
  let unpaidCount = 0;

  for (const o of orders) {
    if (o.stage === 'Done') continue;
    if (o.date === todayStr) todayLoad += effortWeight(o.eff) * o.qty;
    if (o.pay !== 'Lunas') unpaidCount++;
  }

  const q = queue(Date.now(), orders, settings);

  return { todayLoad, queueCount: q.length, unpaidCount, todayDate: todayStr };
}
