-- Seed test data for local development
-- 1. Reset local DB:  npx wrangler d1 execute satu-tangan-db --local --file=migrations/0001_initial.sql
-- 2. Seed:             npx wrangler d1 execute satu-tangan-db --local --file=migrations/seed.sql
-- 3. In browser console after page loads:
--      localStorage.setItem('st_auth_token', 'seed-token-abc');
--      localStorage.setItem('st_username', 'test');
--      location.reload();

INSERT OR IGNORE INTO users (id, username, token, pin_hash, pin_salt)
VALUES ('seed-user-1', 'test', 'seed-token-abc', '', '');

INSERT OR IGNORE INTO orders (id, user_id, name, phone, design, eff, qty, price, date, time, addr, pay, stage, notes, created_at, updated_at)
VALUES
  ('o-unpaid',  'seed-user-1', 'Sari',   '08123456789', 'Balon Latex',   'Med',  2, 150000, date('now'), '10:00', 'Jl. Merpati No.5',  'Unpaid', 'Confirmed', '', datetime('now'), datetime('now')),
  ('o-dp',      'seed-user-1', 'Budi',   '08765432100', 'Balon Foil',    'Low',  1,  85000, date('now'), '14:00', 'Jl. Kenanga No.12', 'DP',     'Crafting',  '', datetime('now'), datetime('now')),
  ('o-lunas',   'seed-user-1', 'Citra',  '08129876543', 'Bouquet Balon', 'High', 3, 350000, date('now'), '16:30', 'Jl. Mawar No.7',    'Lunas',  'Out',       '', datetime('now'), datetime('now')),
  ('o-unpaid2', 'seed-user-1', 'Dedi',   '08111111111', 'Balon Latex',   'Low',  1,  50000, date('now','+1 day'), '09:00', 'Jl. Melati No.3',   'Unpaid', 'Confirmed', '', datetime('now'), datetime('now')),
  ('o-dp2',     'seed-user-1', 'Eni',    '08222222222', 'Dekorasi',      'Med',  1, 200000, date('now','+1 day'), '11:00', 'Jl. Anggrek No.8',  'DP',     'Crafting',  '', datetime('now'), datetime('now')),
  ('o-lunas2',  'seed-user-1', 'Fajar',  '08333333333', 'Balon Gate',    'High', 5, 750000, date('now'), '08:00', 'Jl. Flamboyan No.1', 'Lunas',  'Done',     '', datetime('now'), datetime('now'));
