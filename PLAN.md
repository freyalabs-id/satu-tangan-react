# Plan: Satu Tangan Remake (React + Vite + DB-First)

## Context

Remaking the existing Svelte 5 local-first PWA (`satu-tangan/`) into a React + Vite + Tailwind app (`satu-tangan-remake/`). The key architectural shift: **local-first with IndexedDB + sync** becomes **db-first with direct API calls**. This eliminates ~400 lines of sync/offline logic and simplifies the mental model.

Auth is upgraded from username-only to **username + 6-digit PIN** to prevent casual access.

## Stack

| Layer | Current | Remake |
|-------|---------|--------|
| Frontend | Svelte 5 + Tailwind v4 | React 19 + Tailwind v4 + TypeScript |
| State | IndexedDB + $state runes | TanStack Query v5 + useState |
| Backend | CF Pages Functions + D1 | Same (with new endpoints) |
| Auth | Username → token | Username + PIN → token |
| Offline | Full (IndexedDB + sync) | None (db-first) |

## What Gets Dropped

- `idb` dependency and IndexedDB store (`store.js`)
- Sync logic (`sync.js` — push/pull/fullRestore)
- SyncStatus indicator
- JSON backup/restore (data lives in DB)
- Offline fallback auth (random token when offline)

## What Gets Kept

- All order management (CRUD, stage, payment)
- Capacity views (BalloonGauge, DaysView, BoardView)
- Craft queue, StatsBar
- ICS calendar export (`reminders.ts`)
- Design presets auto-save
- WhatsApp link generation
- Settings (cap, lead, designs, icon)
- Full design system (dark warm palette, typography, components)
- All UI copy in Bahasa Indonesia

---

## Phase 1: Project Scaffold

### 1.1 Init

```
satu-tangan-remake/
├── src/
│   ├── api/           # API client (fetch wrapper)
│   ├── components/    # UI components
│   ├── hooks/         # TanStack Query hooks
│   ├── lib/           # domain.ts, config.ts, reminders.ts
│   ├── types/         # TypeScript interfaces
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css      # Tailwind @theme with design tokens
├── functions/
│   └── api/           # CF Pages Functions (auth, orders, settings)
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── wrangler.jsonc
└── package.json
```

Dependencies:
- `react`, `react-dom`
- `@tanstack/react-query`
- Dev: `typescript`, `@types/react`, `@types/react-dom`, `tailwindcss`, `@tailwindcss/vite`, `vite`, `wrangler`

### 1.2 Tailwind Theme

Port design tokens from `satu-tangan/src/app.css` into `index.css` using `@theme`:
- Colors: bg, surface, slip, line, line2, ink, soft, pop, g1, g2, g3
- Fonts: display (Bricolage Grotesque), body (system), mono (Space Mono)
- Radii: sm(8), md(12), lg(16), full(9999)

### 1.3 TypeScript Types

```typescript
// src/types/index.ts
type Stage = 'Confirmed' | 'Crafting' | 'Out' | 'Done'
type Payment = 'Unpaid' | 'DP' | 'Lunas'
type Effort = 'Low' | 'Med' | 'High'

interface Order {
  id: string; name: string; phone: string; design: string
  eff: Effort; qty: number; price: number
  date: string; time: string; addr: string
  pay: Payment; stage: Stage; notes: string
  createdAt: string; updatedAt: string
}

interface Settings { cap: number; lead: number; designs: DesignPreset[]; icon: string }
interface DesignPreset { name: string; eff: Effort; price: number }
```

---

## Phase 2: Backend API Changes

### 2.1 Auth (`functions/api/auth.js` — rewrite)

- POST `{ username, pin }` — register or login
- PIN validated as 6 digits, hashed with SHA-256 + salt before storing
- If user exists: verify PIN hash → return token
- If new user: create with hashed PIN → return token
- Schema change: add `pin_hash TEXT` column to `users` table

### 2.2 Orders (`functions/api/orders.js` — rewrite)

- `GET /api/orders` — list all orders for user
- `POST /api/orders` — create order (generate id + timestamps server-side)
- `PUT /api/orders/:id` — update order
- `DELETE /api/orders/:id` — delete order
- All require Bearer token auth

### 2.3 Settings (`functions/api/settings.js` — new)

- `GET /api/settings` — return user settings (or defaults)
- `PUT /api/settings` — upsert settings

### 2.4 Shared Auth Middleware

Extract `getUserFromToken(request, env)` helper used by all endpoints:
- Reads Bearer token from Authorization header
- Queries `users` table by token
- Returns user.id or null

---

## Phase 3: Frontend — API & State Layer

### 3.1 API Client (`src/api/client.ts`)

Simple fetch wrapper:
- Base URL from `import.meta.env.VITE_API_BASE || ''`
- Auto-attach `Authorization: Bearer <token>` from localStorage
- Handle 401 → clear token, show login

### 3.2 TanStack Query Hooks (`src/hooks/`)

- `useOrders()` — GET /api/orders, staleTime 30s
- `useSettings()` — GET /api/settings, staleTime 5min
- `useCreateOrder()` — POST, invalidate orders on success
- `useUpdateOrder()` — PUT, optimistic update in cache
- `useDeleteOrder()` — DELETE, remove from cache
- `useUpdateSettings()` — PUT, invalidate settings

### 3.3 Auth State (`src/hooks/useAuth.ts`)

- `useState` for token + username (init from localStorage)
- `login(username, pin)` → POST /api/auth → store token
- `register(username, pin)` → same endpoint (auto-creates)
- `logout()` → clear localStorage, reset state

---

## Phase 4: Frontend — Components

### Migration order (dependencies flow bottom-up):

1. **Pure utilities** — copy `config.ts`, `domain.ts`, `reminders.ts` from Svelte (just rename .js → .ts, add types)
2. **Leaf components** — `LogoIcon`, `BalloonGauge`, `Toast`, `StatsBar`
3. **Order display** — `OrderCard` (with stage spine, payment badge, WA link)
4. **Views** — `DaysView`, `BoardView`, `CraftQueue`
5. **Sheets** — `OrderSheet` (form), `SettingsSheet`
6. **Auth** — `AuthPrompt` (username + PIN form, login/register toggle)
7. **Root** — `App.tsx` (orchestrates everything)

### Component patterns:
- Props interfaces for all components
- `useState` for local form state
- Mutations called in event handlers with toast feedback
- No prop drilling beyond 2 levels (orders/settings come from hooks in views)

---

## Phase 5: Implementation Order (Build Sequence)

| Step | What | Files |
|------|------|-------|
| 1 | Scaffold (Vite + React + TS + Tailwind) | package.json, vite.config.ts, tsconfig.json, index.html |
| 2 | Design tokens (Tailwind theme) | src/index.css |
| 3 | Types + config + domain logic | src/types/, src/lib/config.ts, src/lib/domain.ts |
| 4 | Backend: auth with PIN | functions/api/auth.js |
| 5 | Backend: orders CRUD | functions/api/orders.js |
| 6 | Backend: settings | functions/api/settings.js |
| 7 | API client + query hooks | src/api/client.ts, src/hooks/ |
| 8 | Auth hook + AuthPrompt component | src/hooks/useAuth.ts, src/components/AuthPrompt.tsx |
| 9 | Leaf components | LogoIcon, BalloonGauge, Toast, StatsBar |
| 10 | OrderCard + OrderSheet | src/components/OrderCard.tsx, OrderSheet.tsx |
| 11 | Views (Days, Board, Queue) | src/components/DaysView.tsx, BoardView.tsx, CraftQueue.tsx |
| 12 | SettingsSheet | src/components/SettingsSheet.tsx |
| 13 | App.tsx (wire everything) | src/App.tsx |
| 14 | ICS export + share utility | src/lib/reminders.ts, src/lib/share.ts |
| 15 | Wrangler config + deploy test | wrangler.jsonc |

---

## Verification

1. `npm run dev` — app loads, shows AuthPrompt
2. Register with username + PIN → redirects to main view
3. Create order → appears in DaysView
4. Edit order → changes persist on refresh
5. Cycle payment badge → updates immediately (optimistic)
6. Advance stage → card moves in BoardView
7. Settings → change cap → BalloonGauge reflects new capacity
8. Calendar export → downloads .ics file
9. Logout → returns to AuthPrompt, token cleared
10. Login with wrong PIN → error toast
11. `npm run build && wrangler dev` — full production preview works
