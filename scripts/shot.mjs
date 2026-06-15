import { chromium, devices } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:5176';
const iphone = devices['iPhone 12'];

const today = new Date('2026-06-15');
const iso = (d) => d.toLocaleDateString('en-CA');
const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return iso(d); };

const weights = Array.from({ length: 8 }, (_, i) => ({
  date: daysAgo(28 - i * 4),
  weight: 72 + i * 0.6 + (i % 2 ? 0.2 : -0.1),
}));
const history = Array.from({ length: 7 }, (_, i) => ({
  date: daysAgo(6 - i),
  calories: 2600 + Math.round(Math.sin(i) * 400) + i * 30,
  protein: 150 + i * 3,
  water_ml: 2200 + Math.round(Math.cos(i) * 500),
}));
const profile = { id: 1, name: 'אלוף', goal_weight: 78, calorie_target: 3000, protein_target: 160, water_target_ml: 3000 };
const insights = {
  logged_days: 24, current_streak: 6, training_days: 14, training_dates: [daysAgo(2), daysAgo(5)],
  average_sleep: 7.2, protein_goal_days: 19, calorie_goal_days: 21, water_goal_days: 17,
  weekly_training: Array.from({ length: 4 }, (_, i) => ({ start: daysAgo(21 - i * 7), count: 3 + (i % 3) })),
};

const mocks = {
  '/weights': weights,
  '/history': history,
  '/profile': profile,
  '/insights': insights,
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...iphone, locale: 'he-IL' });
await ctx.route('**/api/**', (route) => {
  const path = new URL(route.request().url()).pathname.replace(/^.*\/api/, '');
  const key = Object.keys(mocks).find((k) => path.startsWith(k));
  if (key) return route.fulfill({ json: mocks[key] });
  return route.fulfill({ json: {} });
});
const page = await ctx.newPage();

await page.goto(`${BASE}/progress`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.screenshot({ path: 'scripts/shot-progress.png' });
await page.screenshot({ path: 'scripts/shot-progress-full.png', fullPage: true });
const nav = page.locator('nav[aria-label="ניווט ראשי"]');
await nav.screenshot({ path: 'scripts/shot-nav.png' });
console.log('done');

await browser.close();
