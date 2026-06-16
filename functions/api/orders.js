import { getUserFromToken, corsHeaders, json, mapOrder } from './_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const user = await getUserFromToken(request, env);
  if (!user) return json({ error: 'Tidak sah' }, 401);

  try {
    if (request.method === 'GET') {
      const orders = await env.satu_tangan_db.prepare(
        'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
      ).bind(user.id).all();
      return json({ orders: (orders.results || []).map(mapOrder) });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const id = globalThis.crypto.randomUUID();
      const now = new Date().toISOString();

      await env.satu_tangan_db.prepare(`
        INSERT INTO orders (id, user_id, name, phone, design, eff, qty, price, date, time, addr, pay, stage, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, user.id, body.name || '', body.phone || '', body.design || '',
        body.eff || 'Med', body.qty || 1, body.price || 0,
        body.date || '', body.time || '12:00', body.addr || '',
        body.pay || 'Unpaid', body.stage || 'Confirmed', body.notes || '',
        now, now
      ).run();

      return json({ id, createdAt: now, updatedAt: now }, 201);
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (e) {
    return json({ error: 'Gagal memproses', detail: e.message }, 500);
  }
}
