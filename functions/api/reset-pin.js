import { corsHeaders, json } from './_utils.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const { key, username, pin } = await request.json();
    if (!key || key !== env.ST_RESET_KEY) {
      return json({ error: 'Kunci reset tidak sah' }, 403);
    }
    if (!username || !pin || !/^\d{6}$/.test(pin)) {
      return json({ error: 'Username dan PIN 6 digit diperlukan' }, 400);
    }

    const name = username.trim().toLowerCase();
    const encoder = new TextEncoder();
    const pinSalt = crypto.randomUUID().slice(0, 8);
    const data = encoder.encode(pinSalt + pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const pinHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0')).join('');

    const result = await env.satu_tangan_db.prepare(
      'UPDATE users SET pin_hash = ?, pin_salt = ? WHERE username = ?'
    ).bind(pinHash, pinSalt, name).run();

    if (result.changes === 0) {
      return json({ error: 'Pengguna tidak ditemukan' }, 404);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: 'Gagal mereset PIN', detail: e.message }, 500);
  }
}
