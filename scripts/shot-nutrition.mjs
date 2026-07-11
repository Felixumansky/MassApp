import { chromium, devices } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:5176';
const OUT = process.argv[3] || '.';
const iphone = devices['iPhone 12'];

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...iphone, locale: 'he-IL' });
// אין backend בטסט — עונים ריק לכל קריאת API
await ctx.route('**/api/**', (route) => route.fulfill({ json: {} }));
const page = await ctx.newPage();
page.on('pageerror', (e) => console.error('PAGE ERROR:', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('CONSOLE:', m.text()));

await page.goto(`${BASE}/nutrition`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/nut-1-empty.png`, fullPage: true });

// פתיחת גיליון הוספה
await page.getByRole('button', { name: 'הוספת ארוחה' }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/nut-2-addsheet.png` });

// מעבר להקלדה וחיפוש בקטלוג
await page.getByRole('tab', { name: 'הקלדה' }).click();
await page.getByLabel('חיפוש בקטלוג המאכלים').fill('חזה עוף');
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/nut-3-search.png` });

// בחירה + הוספה לארוחה
await page.getByRole('button', { name: /חזה עוף בגריל/ }).first().click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'הוסף לארוחה' }).click();
// עוד פריט: אורז
await page.getByLabel('חיפוש בקטלוג המאכלים').fill('אורז');
await page.waitForTimeout(300);
await page.getByRole('button', { name: /אורז לבן מבושל/ }).first().click();
await page.getByRole('button', { name: 'הוסף לארוחה' }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/nut-4-cart.png` });

// המשך לאישור
await page.getByRole('button', { name: /המשך לאישור/ }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/nut-5-review.png`, fullPage: true });

// שמירה ליומן
await page.getByRole('button', { name: 'שמור ליומן' }).click();
await page.waitForTimeout(1000);
await page.screenshot({ path: `${OUT}/nut-6-today.png`, fullPage: true });

// מים
await page.getByRole('button', { name: /בקבוק 500/ }).click();
await page.waitForTimeout(600);

// מצב סטטיסטיקות
await page.getByRole('button', { name: 'סטטיסטיקות' }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/nut-7-stats.png`, fullPage: true });

console.log('done');
await browser.close();
