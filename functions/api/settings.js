import { getUserFromToken, corsHeaders, json } from './_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const user = await getUserFromToken(request, env);
  if (!user) return json({ error: 'Tidak sah' }, 401);

  try {
    switch (request.method) {
      case 'GET':
        return handleGET(env, user.id);
      case 'PUT':
        return handlePUT(request, env, user.id);
      default:
        return json({ error: 'Method not allowed' }, 405);
    }
  } catch (e) {
    return json({ error: 'Gagal memproses', detail: e.message }, 500);
  }
}

async function handleGET(env, userId) {
  const row = await env.satu_tangan_db.prepare(
    'SELECT * FROM settings WHERE user_id = ?'
  ).bind(userId).first();

  if (!row) {
    return json({ settings: { cap: 6, lead: 12, designs: [], icon: 'balloon' } });
  }

  return json({
    settings: {
      cap: row.cap ?? 6,
      lead: row.lead ?? 12,
      designs: JSON.parse(row.designs || '[]'),
      icon: row.icon || 'balloon',
    },
  });
}

async function handlePUT(request, env, userId) {
  const body = await request.json();
  const now = new Date().toISOString();
  const cap = body.cap ?? 6;
  const lead = body.lead ?? 12;
  const designs = JSON.stringify(body.designs || []);
  const icon = body.icon || 'balloon';

  const existing = await env.satu_tangan_db.prepare(
    'SELECT user_id FROM settings WHERE user_id = ?'
  ).bind(userId).first();

  if (existing) {
    await env.satu_tangan_db.prepare(`
      UPDATE settings SET cap = ?, lead = ?, designs = ?, icon = ?, updated_at = ?
      WHERE user_id = ?
    `).bind(cap, lead, designs, icon, now, userId).run();
  } else {
    await env.satu_tangan_db.prepare(`
      INSERT INTO settings (user_id, cap, lead, designs, icon, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(userId, cap, lead, designs, icon, now).run();
  }

  return json({ ok: true });
}


