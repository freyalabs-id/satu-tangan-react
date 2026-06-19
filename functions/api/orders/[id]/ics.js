import { corsHeaders, json, mapOrder } from '../../_utils.js';
import { icsForOrder } from '../../_ics.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const orderId = segments[2];
  if (!orderId || orderId.length < 10) {
    return json({ error: 'ID tidak valid' }, 400);
  }

  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const token = url.searchParams.get('t');
  if (!token || token.length < 10) {
    return json({ error: 'Tidak sah' }, 401);
  }

  const user = await env.satu_tangan_db.prepare(
    'SELECT id FROM users WHERE token = ?'
  ).bind(token).first();
  if (!user) return json({ error: 'Tidak sah' }, 401);

  const order = await env.satu_tangan_db.prepare(
    'SELECT * FROM orders WHERE id = ? AND user_id = ?'
  ).bind(orderId, user.id).first();
  if (!order) return json({ error: 'Pesanan tidak ditemukan' }, 404);

  const settings = await env.satu_tangan_db.prepare(
    'SELECT lead FROM settings WHERE user_id = ?'
  ).bind(user.id).first();
  const lead = settings?.lead ?? 12;

  const ics = icsForOrder(mapOrder(order), { craft: true, delivery: true }, lead);

  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="pengingat-${order.name}.ics"`,
      ...corsHeaders(),
    },
  });
}
