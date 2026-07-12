---
name: verify
description: Build, launch, and drive LiftLog (MassApp) in a browser to verify changes end-to-end.
---

# Verifying MassApp (LiftLog)

React 18 + Vite SPA (Hebrew RTL), Capacitor wrapper. Local-first: all state lives in a localStorage/JSON blob; the backend (`../MassAPI`) is only needed for login and AI food analysis — most flows work without it.

## Build / launch
- `npm run dev` (background) → http://localhost:5173. Ready in ~1s; check with `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/`.
- `npm run check` = lint + vitest + build. NOTE: lint currently fails on pre-existing unused-var errors in `src/pages/Weight.jsx` and `src/pages/WorkoutDetail.jsx` (as of 2026-07-12) — not caused by your change unless you touched those files.

## Drive with Playwright
- `playwright` is in devDependencies. ESM scripts outside the repo can't resolve it by name — import via absolute URL: `import { chromium } from 'file:///C:/GitHub/MassApp/node_modules/playwright/index.mjs';`
- Mobile viewport: `{ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }` — the bottom nav/FAB are `lg:hidden`, desktop sidebar is `hidden lg:flex`.
- **Fake login (no backend needed):** before page load,
  `ctx.addInitScript(() => localStorage.setItem('liftlog.auth', JSON.stringify({ token: 'fake', exp: Date.now() + 86400000, user: { email: 'felix.um86@gmail.com' } })))`
  That email is on the nutrition allowlist (`src/lib/nutritionAccess.js`). Omit auth for an anonymous user.

## Gotchas
- Two navs match `aria-label="ניווט ראשי"` (sidebar + bottom bar) — scope bottom-bar queries with `nav.fixed`.
- Nutrition FAB aria-label is `הוספת ארוחה` for allowlisted users, `התחל אימון`/`עצור טיימר`/`המשך אימון` otherwise.
- Water progressbar: `[role="progressbar"][aria-label="התקדמות מים"]` with `aria-valuenow`.
- AI meal analysis (`/api/nutrition/analyze`) needs MassAPI + OPENAI_API_KEY; verify meal flows via the local catalog (type mode) or water logging instead.
