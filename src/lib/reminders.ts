import { CONFIG } from './config';
import { parseDateTime, craftBy, rupiah } from './domain';
import type { Order } from '../types';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function icsDate(date: Date): string {
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

function escapeText(str: string): string {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function buildCraftEvent(order: Order, lead: number): string {
  const cb = craftBy(order, lead);
  const dtStart = icsDate(cb);
  const now = icsDate(new Date());
  const uid = `${order.id}-craft@satu-tangan`;
  const sequence = order.updatedAt ? Math.floor(new Date(order.updatedAt).getTime() / 1000) : 0;

  let alarm = '';
  if (CONFIG.CRAFT_ALARM_OFFSET >= 0) {
    alarm = [
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:Waktunya membuat ${escapeText(order.design || 'pesanan')} untuk ${escapeText(order.name)}`,
      `TRIGGER:-PT${CONFIG.CRAFT_ALARM_OFFSET}M`,
      'END:VALARM',
    ].join('\r\n');
  }

  const summary = `Buat ${order.design || 'pesanan'} untuk ${order.name}`;
  const description = [
    `Pelanggan: ${order.name}`,
    `Desain: ${order.design}`,
    `Jumlah: ${order.qty}`,
    `Harga: ${rupiah(order.price)}`,
    `Alamat: ${order.addr}`,
    order.notes ? `Catatan: ${order.notes}` : '',
  ].filter(Boolean).join('\\n');

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `SEQUENCE:${sequence}`,
    alarm,
    'END:VEVENT',
  ].filter(Boolean).join('\r\n');
}

function buildDeliveryEvent(order: Order): string {
  const delivery = parseDateTime(order.date, order.time);
  const dtStart = icsDate(delivery);
  const now = icsDate(new Date());
  const uid = `${order.id}-delivery@satu-tangan`;
  const sequence = order.updatedAt ? Math.floor(new Date(order.updatedAt).getTime() / 1000) : 0;

  const alarm = [
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:Pengiriman ${escapeText(order.design || 'pesanan')} ke ${escapeText(order.name)} dalam ${CONFIG.DELIVERY_ALARM_LEAD} menit`,
    `TRIGGER:-PT${CONFIG.DELIVERY_ALARM_LEAD}M`,
    'END:VALARM',
  ].join('\r\n');

  const summary = `Kirim ${order.design || 'pesanan'} untuk ${order.name}`;
  const description = [
    `Pelanggan: ${order.name}`,
    `Desain: ${order.design}`,
    `Jumlah: ${order.qty}`,
    `Harga: ${rupiah(order.price)}`,
    `Alamat: ${order.addr}`,
    order.notes ? `Catatan: ${order.notes}` : '',
  ].filter(Boolean).join('\\n');

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `SEQUENCE:${sequence}`,
    alarm,
    'END:VEVENT',
  ].filter(Boolean).join('\r\n');
}

export function icsForOrder(order: Order, opts: { craft?: boolean; delivery?: boolean } = {}, lead = CONFIG.DEFAULT_LEAD): string {
  const events: string[] = [];
  if (opts.craft !== false) events.push(buildCraftEvent(order, lead));
  if (opts.delivery !== false) events.push(buildDeliveryEvent(order));

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Satu Tangan//Pesanan Balon//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Satu Tangan Pesanan',
    `X-WR-TIMEZONE:${CONFIG.TZ_NAME}`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n') + '\r\n';
}

export function icsForMany(orders: Order[], opts: { craft?: boolean; delivery?: boolean } = {}, lead = CONFIG.DEFAULT_LEAD): string {
  const events: string[] = [];
  for (const order of orders) {
    if (opts.craft !== false) events.push(buildCraftEvent(order, lead));
    if (opts.delivery !== false) events.push(buildDeliveryEvent(order));
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Satu Tangan//Pesanan Balon//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Satu Tangan Pesanan',
    `X-WR-TIMEZONE:${CONFIG.TZ_NAME}`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n') + '\r\n';
}
