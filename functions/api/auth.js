import { corsHeaders, json, getUserFromToken } from './_utils.js';

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export function onRequestPost(context) {
  return handleLoginRegister(context);
}

export function onRequestPut(context) {
  return handleChangePin(context);
}

async function handleLoginRegister({ request, env }) {
  try {
    const { username, pin } = await request.json();
    if (!username || typeof username !== 'string' || !username.trim()) {
      return json({ error: 'Username diperlukan' }, 400);
    }
    if (!pin || typeof pin !== 'string' || !/^\d{6}$/.test(pin)) {
      return json({ error: 'PIN harus 6 digit angka' }, 400);
    }

    const name = username.trim().toLowerCase();
    const existing = await env.satu_tangan_db.prepare(
      'SELECT id, token, pin_hash, pin_salt FROM users WHERE username = ?'
    ).bind(name).first();

    if (existing) {
      const hash = await sha256(pin, existing.pin_salt);
      if (hash !== existing.pin_hash) {
        await new Promise(r => setTimeout(r, 1000));
        return json({ error: 'PIN salah' }, 400);
      }
      return json({ token: existing.token, userId: existing.id });
    }

    const id = crypto.randomUUID();
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes, (b) => b.toString(16).padStart(2, '0')).join('');
    const pinSalt = crypto.randomUUID().slice(0, 8);
    const pinHash = await sha256(pin, pinSalt);

    await env.satu_tangan_db.prepare(
      'INSERT INTO users (id, username, token, pin_hash, pin_salt) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, name, token, pinHash, pinSalt).run();

    return json({ token, userId: id });
  } catch (e) {
    return json({ error: 'Gagal autentikasi', detail: e.message }, 500);
  }
}

async function handleChangePin({ request, env }) {
  const user = await getUserFromToken(request, env);
  if (!user) return json({ error: 'Tidak sah' }, 401);

  try {
    const { currentPin, newPin } = await request.json();
    if (!currentPin || !/^\d{6}$/.test(currentPin)) {
      return json({ error: 'PIN saat ini harus 6 digit' }, 400);
    }
    if (!newPin || !/^\d{6}$/.test(newPin)) {
      return json({ error: 'PIN baru harus 6 digit' }, 400);
    }
    if (currentPin === newPin) {
      return json({ error: 'PIN baru tidak boleh sama' }, 400);
    }

    const row = await env.satu_tangan_db.prepare(
      'SELECT pin_hash, pin_salt FROM users WHERE id = ?'
    ).bind(user.id).first();

    if (!row) return json({ error: 'Pengguna tidak ditemukan' }, 404);

    const currentHash = await sha256(currentPin, row.pin_salt);
    if (currentHash !== row.pin_hash) {
      return json({ error: 'PIN saat ini salah' }, 400);
    }

    const newSalt = crypto.randomUUID().slice(0, 8);
    const newHash = await sha256(newPin, newSalt);

    await env.satu_tangan_db.prepare(
      'UPDATE users SET pin_hash = ?, pin_salt = ? WHERE id = ?'
    ).bind(newHash, newSalt, user.id).run();

    return json({ ok: true });
  } catch (e) {
    return json({ error: 'Gagal mengubah PIN', detail: e.message }, 500);
  }
}

async function sha256(input, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}


