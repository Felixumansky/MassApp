/* Pure, testable selectors over the nutrition slices (meals / waterLogs / goals).
   Side-effect free, בדומה ל-analytics.js של האימונים. תאריכים הם dayKey מקומי. */
import { dayKey } from './utils.js';

export const MEAL_TYPES = [
  { id: 'breakfast', label: 'בוקר', emoji: '🌅' },
  { id: 'lunch', label: 'צהריים', emoji: '☀️' },
  { id: 'dinner', label: 'ערב', emoji: '🌙' },
  { id: 'snack', label: 'ביניים', emoji: '🍎' },
];

export const MACROS = [
  { id: 'protein', label: 'חלבון', color: '#A78BFA', kcalPerGram: 4 },
  { id: 'carbs', label: 'פחמימות', color: '#FBBF24', kcalPerGram: 4 },
  { id: 'fat', label: 'שומן', color: '#34D399', kcalPerGram: 9 },
];

const r1 = (n) => Math.round(n * 10) / 10;

/** סכום ערכי הפריטים של ארוחה אחת. */
export function mealTotals(meal) {
  return (meal.items || []).reduce(
    (acc, it) => ({
      calories: Math.round(acc.calories + (Number(it.calories) || 0)),
      protein: r1(acc.protein + (Number(it.protein) || 0)),
      carbs: r1(acc.carbs + (Number(it.carbs) || 0)),
      fat: r1(acc.fat + (Number(it.fat) || 0)),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/** טוטאלים ליום נתון: קלוריות, מאקרו ומים. */
export function dayTotals(meals, waterLogs, date = dayKey()) {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, waterMl: 0 };
  for (const m of meals || []) {
    if (m.date !== date) continue;
    const t = mealTotals(m);
    totals.calories += t.calories;
    totals.protein = r1(totals.protein + t.protein);
    totals.carbs = r1(totals.carbs + t.carbs);
    totals.fat = r1(totals.fat + t.fat);
  }
  for (const w of waterLogs || []) {
    if (w.date === date) totals.waterMl += Number(w.amountMl) || 0;
  }
  return totals;
}

/** ארוחות של יום נתון מקובצות לפי סוג: { breakfast: [...], lunch: [...], ... } */
export function mealsByType(meals, date = dayKey()) {
  const out = Object.fromEntries(MEAL_TYPES.map((t) => [t.id, []]));
  for (const m of meals || []) {
    if (m.date !== date) continue;
    (out[m.mealType] || out.snack).push(m);
  }
  return out;
}

/** [{ date, calories, protein, carbs, fat }] — `days` ימים אחורה כולל היום, בסדר עולה.
    ימים בלי ארוחות מופיעים עם אפסים כדי שהגרף לא ידלג עליהם. */
export function caloriesByDay(meals, days = 7, end = dayKey()) {
  const byDate = new Map();
  for (const m of meals || []) {
    const t = mealTotals(m);
    const cur = byDate.get(m.date) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
    byDate.set(m.date, {
      calories: cur.calories + t.calories,
      protein: r1(cur.protein + t.protein),
      carbs: r1(cur.carbs + t.carbs),
      fat: r1(cur.fat + t.fat),
    });
  }
  const endDate = new Date(end + 'T00:00:00');
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    out.push({ date: key, ...(byDate.get(key) || { calories: 0, protein: 0, carbs: 0, fat: 0 }) });
  }
  return out;
}

/** התפלגות קלוריות לפי מאקרו בטווח תאריכים (ברירת מחדל: הכל).
    מחזיר [{ id, label, color, grams, kcal, pct }] — pct מתוך סך קלוריות המאקרו. */
export function macroDistribution(meals, startKey, endKey) {
  const grams = { protein: 0, carbs: 0, fat: 0 };
  for (const m of meals || []) {
    if (startKey && m.date < startKey) continue;
    if (endKey && m.date > endKey) continue;
    const t = mealTotals(m);
    grams.protein = r1(grams.protein + t.protein);
    grams.carbs = r1(grams.carbs + t.carbs);
    grams.fat = r1(grams.fat + t.fat);
  }
  const rows = MACROS.map((mac) => ({
    id: mac.id,
    label: mac.label,
    color: mac.color,
    grams: grams[mac.id],
    kcal: Math.round(grams[mac.id] * mac.kcalPerGram),
  }));
  const totalKcal = rows.reduce((s, x) => s + x.kcal, 0);
  return rows.map((x) => ({ ...x, pct: totalKcal ? Math.round((x.kcal / totalKcal) * 100) : 0 }));
}

/** התפלגות קלוריות לפי סוג ארוחה בטווח: [{ id, label, emoji, kcal, pct }] */
export function mealTypeDistribution(meals, startKey, endKey) {
  const kcalByType = Object.fromEntries(MEAL_TYPES.map((t) => [t.id, 0]));
  for (const m of meals || []) {
    if (startKey && m.date < startKey) continue;
    if (endKey && m.date > endKey) continue;
    const type = m.mealType in kcalByType ? m.mealType : 'snack';
    kcalByType[type] += mealTotals(m).calories;
  }
  const total = Object.values(kcalByType).reduce((s, n) => s + n, 0);
  return MEAL_TYPES.map((t) => ({
    id: t.id,
    label: t.label,
    emoji: t.emoji,
    kcal: kcalByType[t.id],
    pct: total ? Math.round((kcalByType[t.id] / total) * 100) : 0,
  }));
}

/** עמידה ביעד קלוריות ב-`days` הימים האחרונים (רק ימים שנרשם בהם משהו):
    { trackedDays, hitDays, avgCalories } — "עמידה" = 85%–110% מהיעד. */
export function goalAdherence(meals, goals, days = 7, end = dayKey()) {
  const series = caloriesByDay(meals, days, end).filter((d) => d.calories > 0);
  const target = Number(goals?.calories) || 0;
  const hitDays = target
    ? series.filter((d) => d.calories >= target * 0.85 && d.calories <= target * 1.1).length
    : 0;
  const avgCalories = series.length
    ? Math.round(series.reduce((s, d) => s + d.calories, 0) / series.length)
    : 0;
  return { trackedDays: series.length, hitDays, avgCalories };
}

/** הודעת עידוד דינמית לפי מצב היום מול היעדים. */
export function encouragementMessage(totals, goals) {
  const calTarget = Number(goals?.calories) || 0;
  const proteinTarget = Number(goals?.protein) || 0;
  if (!totals.calories) return 'עוד לא נרשמה ארוחה היום — בתיאבון! 🍽️';
  if (proteinTarget && totals.protein >= proteinTarget && totals.calories < calTarget * 1.1) {
    return 'יעד החלבון הושלם! 💪';
  }
  if (calTarget) {
    const left = calTarget - totals.calories;
    if (left > calTarget * 0.5) return `התחלה טובה — עוד ${left} קלוריות ליעד 🔥`;
    if (left > 0) return `עוד ${left} קלוריות ליעד! 🔥`;
    if (totals.calories <= calTarget * 1.1) return 'הגעת ליעד הקלוריות היומי! 🎯';
    return `חרגת ב-${totals.calories - calTarget} קלוריות מהיעד — שים לב 👀`;
  }
  return `נרשמו ${totals.calories} קלוריות היום`;
}
