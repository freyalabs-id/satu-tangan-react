import { getUserFromToken, corsHeaders, json, mapOrder } from '../_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const user = await getUserFromToken(request, env);
  if (!user) return json({ error: 'Tidak sah' }, 401);

  const url = new URL(request.url);
  const orderId = url.pathname.split('/').pop();
  if (!orderId || orderId.length < 10) {
    return json({ error: 'ID tidak valid' }, 400);
  }

  try {
    switch (request.method) {
      case 'GET': {
        const order = await env.satu_tangan_db.prepare(
          'SELECT * FROM orders WHERE id = ? AND user_id = ?'
        ).bind(orderId, user.id).first();
        if (!order) return json({ error: 'Pesanan tidak ditemukan' }, 404);
        return json({ order: mapOrder(order) });
      }

      case 'PUT':
      case 'PATCH': {
        const body = await request.json();
        const now = new Date().toISOString();

        const existing = await env.satu_tangan_db.prepare(
          'SELECT * FROM orders WHERE id = ? AND user_id = ?'
        ).bind(orderId, user.id).first();

        if (!existing) return json({ error: 'Pesanan tidak ditemukan' }, 404);

        await env.satu_tangan_db.prepare(`
          UPDATE orders SET name = ?, phone = ?, design = ?, eff = ?, qty = ?,
          price = ?, date = ?, time = ?, addr = ?, pay = ?,
          stage = ?, notes = ?, updated_at = ?
          WHERE id = ? AND user_id = ?
        `).bind(
          body.name ?? existing.name, body.phone ?? existing.phone,
          body.design ?? existing.design, body.eff ?? existing.eff,
          body.qty ?? existing.qty, body.price ?? existing.price,
          body.date ?? existing.date, body.time ?? existing.time,
          body.addr ?? existing.addr, body.pay ?? existing.pay,
          body.stage ?? existing.stage, body.notes ?? existing.notes,
          now, orderId, user.id
        ).run();

        return json({ updatedAt: now });
      }

      case 'DELETE': {
        const existing = await env.satu_tangan_db.prepare(
          'SELECT id FROM orders WHERE id = ? AND user_id = ?'
        ).bind(orderId, user.id).first();

        if (!existing) return json({ error: 'Pesanan tidak ditemukan' }, 404);

        await env.satu_tangan_db.prepare(
          'DELETE FROM orders WHERE id = ? AND user_id = ?'
        ).bind(orderId, user.id).run();

        return json({ ok: true });
      }

      default:
        return json({ error: 'Method not allowed' }, 405);
    }
  } catch (e) {
    return json({ error: 'Gagal memproses', detail: e.message }, 500);
  }
}
