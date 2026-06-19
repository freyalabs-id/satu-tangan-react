const CRAFT_ALARM_OFFSET = 0;
const DELIVERY_ALARM_LEAD = 30;
const TZ_NAME = 'Asia/Jakarta';
const DEFAULT_LEAD = 12;

function pad(n) {
  return String(n).padStart(2, '0');
}

function icsDate(date) {
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

function escapeText(str) {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function parseDateTime(dateStr, timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+07:00`);
}

function craftBy(order, lead = DEFAULT_LEAD) {
  const delivery = parseDateTime(order.date, order.time);
  return new Date(delivery.getTime() - lead * 3600000);
}

function rupiah(n) {
  if (typeof n !== 'number' || !Number.isInteger(n)) return 'Rp 0';
  return `Rp ${n.toLocaleString('id-ID')}`;
}

function buildCraftEvent(order, lead) {
  const cb = craftBy(order, lead);
  const dtStart = icsDate(cb);
  const now = icsDate(new Date());
  const uid = `${order.id}-craft@satu-tangan`;
  const sequence = order.updatedAt ? Math.floor(new Date(order.updatedAt).getTime() / 1000) : 0;

  let alarm = '';
  if (CRAFT_ALARM_OFFSET >= 0) {
    alarm = [
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:Waktunya membuat ${escapeText(order.design || 'pesanan')} untuk ${escapeText(order.name)}`,
      `TRIGGER:-PT${CRAFT_ALARM_OFFSET}M`,
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

function buildDeliveryEvent(order) {
  const delivery = parseDateTime(order.date, order.time);
  const dtStart = icsDate(delivery);
  const now = icsDate(new Date());
  const uid = `${order.id}-delivery@satu-tangan`;
  const sequence = order.updatedAt ? Math.floor(new Date(order.updatedAt).getTime() / 1000) : 0;

  const alarm = [
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:Pengiriman ${escapeText(order.design || 'pesanan')} ke ${escapeText(order.name)} dalam ${DELIVERY_ALARM_LEAD} menit`,
    `TRIGGER:-PT${DELIVERY_ALARM_LEAD}M`,
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

export function icsForOrder(order, opts = {}, lead = DEFAULT_LEAD) {
  const events = [];
  if (opts.craft !== false) events.push(buildCraftEvent(order, lead));
  if (opts.delivery !== false) events.push(buildDeliveryEvent(order));

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Satu Tangan//Pesanan Balon//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Satu Tangan Pesanan',
    `X-WR-TIMEZONE:${TZ_NAME}`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n') + '\r\n';
}
