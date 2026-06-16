# Satu Tangan

Order management tool for small craft businesses. Track orders, stages, and payments from a single view. Built for one person running production.

## Stack

React 19 · TypeScript · TanStack Query · Tailwind v4 · Vite · Cloudflare Pages + D1

## Setup

```bash
npm install
```

## Dev

```bash
npm run dev          # Vite dev server (port 3000), proxies /api to Wrangler
```

Start the API backend separately:

```bash
npx wrangler pages dev dist  # Cloudflare Pages Functions (port 8788)
```

## Build & Deploy

```bash
npm run deploy       # Builds and deploys to Cloudflare Pages
```

## Type Check

```bash
npm run lint         # tsc --noEmit
```
