export async function getUserFromToken(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  if (!token || token.length < 10) return null;
  return env.satu_tangan_db.prepare(
    'SELECT id FROM users WHERE token = ?'
  ).bind(token).first();
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

export function mapOrder(o) {
  return {
    id: o.id, userId: o.user_id, name: o.name, phone: o.phone,
    design: o.design, eff: o.eff, qty: o.qty, price: o.price,
    date: o.date, time: o.time, addr: o.addr, pay: o.pay,
    stage: o.stage, notes: o.notes, createdAt: o.created_at, updatedAt: o.updated_at,
  };
}
