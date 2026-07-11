import { lazy, Suspense, useMemo, useState } from 'react';
import { Apple, ChartPie, Droplets, Plus, Settings2, UtensilsCrossed, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store.jsx';
import { PageHeader, GlassCard, EmptyState, AppLoader } from '../components/ui.jsx';
import { dayKey, vibrate } from '../lib/utils.js';
import { useDialogFocus } from '../lib/useDialogFocus.js';
import {
  MEAL_TYPES,
  MACROS,
  mealTotals,
  dayTotals,
  mealsByType,
  encouragementMessage,
} from '../lib/nutritionAnalytics.js';
import AddFoodSheet from '../components/AddFoodSheet.jsx';
import AnalysisReview from '../components/AnalysisReview.jsx';

const NutritionCharts = lazy(() => import('../components/NutritionCharts.jsx'));

const WATER_QUICK = [
  { ml: 250, label: 'כוס 250' },
  { ml: 500, label: 'בקבוק 500' },
  { ml: 750, label: 'בקבוק 750' },
];

export default function Nutrition() {
  const { state, dispatch } = useStore();
  const { meals, waterLogs, nutritionGoals } = state;
  const today = dayKey();

  const [view, setView] = useState('today'); // 'today' | 'stats'
  const [adding, setAdding] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null); // meal being viewed/edited
  const [goalsOpen, setGoalsOpen] = useState(false);

  const totals = useMemo(() => dayTotals(meals, waterLogs, today), [meals, waterLogs, today]);
  const grouped = useMemo(() => mealsByType(meals, today), [meals, today]);
  const message = useMemo(() => encouragementMessage(totals, nutritionGoals), [totals, nutritionGoals]);
  const hasMealsToday = MEAL_TYPES.some((t) => grouped[t.id].length > 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        subtitle="מעקב"
        title="תזונה"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => { vibrate(5); setGoalsOpen(true); }}
              aria-label="עריכת יעדים"
              className="press glass flex size-11 shrink-0 items-center justify-center rounded-2xl"
            >
              <Settings2 className="size-5" />
            </button>
            <ViewToggle view={view} onChange={setView} />
          </div>
        }
      />

      {view === 'stats' ? (
        <Suspense fallback={<AppLoader label="טוען גרפים…" />}>
          <NutritionCharts meals={meals} goals={nutritionGoals} />
        </Suspense>
      ) : (
        <>
          {/* טבעת קלוריות + פסי מאקרו */}
          <GlassCard className="flex flex-col items-center gap-4 py-5">
            <CalorieRing calories={totals.calories} target={nutritionGoals.calories} />
            <p className="text-center text-sm font-semibold text-[var(--color-muted-foreground)]" aria-live="polite">
              {message}
            </p>
            <div className="flex w-full flex-col gap-2.5">
              {MACROS.map((mac) => (
                <MacroBar key={mac.id} macro={mac} value={totals[mac.id]} target={nutritionGoals[mac.id]} />
              ))}
            </div>
          </GlassCard>

          {/* מים */}
          <GlassCard>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-bold">
                <Droplets className="size-5" style={{ color: '#38BDF8' }} />
                מים
              </h2>
              <span className="tnum text-sm font-bold" style={{ color: '#38BDF8' }}>
                {totals.waterMl} / {nutritionGoals.waterMl} מ״ל
              </span>
            </div>
            <div className="mb-3 h-2.5 overflow-hidden rounded-full bg-white/[0.06]" role="progressbar"
              aria-label="התקדמות מים" aria-valuenow={totals.waterMl} aria-valuemax={nutritionGoals.waterMl}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (totals.waterMl / nutritionGoals.waterMl) * 100)}%`,
                  background: '#38BDF8',
                }}
              />
            </div>
            <div className="flex gap-2">
              {WATER_QUICK.map((w) => (
                <button
                  key={w.ml}
                  onClick={() => { vibrate(8); dispatch({ type: 'addWater', amountMl: w.ml }); }}
                  className="press glass flex-1 rounded-xl py-2.5 text-xs font-bold"
                >
                  💧 {w.label}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* ארוחות היום */}
          {!hasMealsToday ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="אין ארוחות היום"
              hint="צלמו את הצלחת, דברו, או חפשו בקטלוג — ותראו כמה קלוריות ומה אכלתם."
              action={
                <button onClick={() => { vibrate(8); setAdding(true); }} className="btn-volt press rounded-2xl px-6 py-3 text-sm font-bold">
                  <Plus className="-mt-0.5 me-1 inline size-4" strokeWidth={3} />
                  הוספת ארוחה
                </button>
              }
            />
          ) : (
            <section className="flex flex-col gap-4">
              {MEAL_TYPES.map((t) =>
                grouped[t.id].length === 0 ? null : (
                  <div key={t.id}>
                    <h2 className="mb-2 flex items-center justify-between font-bold">
                      <span>{t.emoji} {t.label}</span>
                      <span className="tnum text-xs font-bold text-[var(--color-muted-foreground)]">
                        {grouped[t.id].reduce((s, m) => s + mealTotals(m).calories, 0)} קק״ל
                      </span>
                    </h2>
                    <ul className="flex flex-col gap-2">
                      {grouped[t.id].map((m) => (
                        <li key={m.id}>
                          <MealCard meal={m} onOpen={() => setEditingMeal(m)} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}
              <button
                onClick={() => { vibrate(8); setAdding(true); }}
                className="btn-volt press flex items-center justify-center gap-1.5 rounded-2xl py-3.5 text-sm font-bold"
              >
                <Plus className="size-4" strokeWidth={3} />
                הוספת ארוחה
              </button>
            </section>
          )}
        </>
      )}

      {/* הוספת ארוחה */}
      <AnimatePresence>
        {adding && (
          <AddFoodSheet
            onClose={() => setAdding(false)}
            onSaved={() => setAdding(false)}
          />
        )}
      </AnimatePresence>

      {/* צפייה/עריכה של ארוחה קיימת */}
      <AnimatePresence>
        {editingMeal && (
          <AnalysisReview
            title="עריכת ארוחה"
            initialItems={editingMeal.items}
            initialMealType={editingMeal.mealType}
            photo={editingMeal.photo}
            saveLabel="שמור שינויים"
            onCancel={() => setEditingMeal(null)}
            onDelete={() => {
              vibrate(8);
              dispatch({ type: 'deleteMeal', id: editingMeal.id });
              setEditingMeal(null);
            }}
            onSave={({ items, mealType }) => {
              vibrate(8);
              dispatch({ type: 'updateMeal', id: editingMeal.id, patch: { items, mealType } });
              setEditingMeal(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* עריכת יעדים */}
      <AnimatePresence>
        {goalsOpen && (
          <GoalsSheet
            goals={nutritionGoals}
            onClose={() => setGoalsOpen(false)}
            onSave={(patch) => {
              vibrate(8);
              dispatch({ type: 'setNutritionGoals', patch });
              setGoalsOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ViewToggle({ view, onChange }) {
  const options = [
    { id: 'today', label: 'היום', icon: Apple },
    { id: 'stats', label: 'סטטיסטיקות', icon: ChartPie },
  ];
  return (
    <span className="glass flex overflow-hidden rounded-2xl p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => { vibrate(5); onChange(o.id); }}
          className="press flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold"
          style={{
            background: view === o.id ? 'rgba(249,115,22,0.18)' : 'transparent',
            color: view === o.id ? '#fdba74' : '#94a3b8',
          }}
          aria-pressed={view === o.id}
        >
          <o.icon className="size-4" />
          {o.label}
        </button>
      ))}
    </span>
  );
}

/** טבעת קלוריות מונפשת בגרדיאנט כתום→ורוד. */
function CalorieRing({ calories, target }) {
  const size = 190;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, target ? calories / target : 0);
  const over = target && calories > target;
  return (
    <div className="relative" style={{ width: size, height: size }} role="img"
      aria-label={`${calories} מתוך ${target} קלוריות היום`}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="cal-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#F43F5E" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="url(#cal-ring)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum text-4xl font-extrabold leading-none">{calories}</span>
        <span className="mt-1 text-xs font-semibold text-[var(--color-muted-foreground)]">
          מתוך {target} קק״ל
        </span>
        {over && <span className="mt-0.5 text-[10px] font-bold text-rose-400">מעל היעד</span>}
      </div>
    </div>
  );
}

function MacroBar({ macro, value, target }) {
  const pct = Math.min(100, target ? (value / target) * 100 : 0);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: macro.color }} />
          {macro.label}
        </span>
        <span className="tnum text-[var(--color-muted-foreground)]">
          {value} / {target} גר׳
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]" role="progressbar"
        aria-label={`התקדמות ${macro.label}`} aria-valuenow={value} aria-valuemax={target}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: macro.color }}
        />
      </div>
    </div>
  );
}

function MealCard({ meal, onOpen }) {
  const t = mealTotals(meal);
  const names = meal.items.map((it) => it.name).join(', ');
  return (
    <GlassCard
      className="flex cursor-pointer items-center gap-3 p-3 transition-all active:scale-[0.98]"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      {meal.photo ? (
        <img src={meal.photo} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
      ) : (
        <span className="glass flex size-12 shrink-0 items-center justify-center rounded-xl text-lg">
          {meal.source === 'voice' ? '🎤' : meal.source === 'catalog' ? '🍽️' : '📝'}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{names || 'ארוחה'}</p>
        <p className="tnum text-[11px] font-semibold text-[var(--color-muted-foreground)]">
          🟣 {t.protein} · 🟡 {t.carbs} · 🟢 {t.fat} גר׳
        </p>
      </div>
      <span className="tnum shrink-0 text-lg font-extrabold" style={{ color: '#fb923c' }}>
        {t.calories}
        <span className="text-xs font-semibold text-[var(--color-muted-foreground)]"> קק״ל</span>
      </span>
    </GlassCard>
  );
}

/* ═══ עריכת יעדים יומיים ═══ */
function GoalsSheet({ goals, onClose, onSave }) {
  const [draft, setDraft] = useState({ ...goals });
  const dialogRef = useDialogFocus(true, onClose);

  const fields = [
    { id: 'calories', label: 'קלוריות (קק״ל)', step: 50 },
    { id: 'protein', label: 'חלבון (גרם)', step: 5 },
    { id: 'carbs', label: 'פחמימות (גרם)', step: 5 },
    { id: 'fat', label: 'שומן (גרם)', step: 5 },
    { id: 'waterMl', label: 'מים (מ״ל)', step: 250 },
  ];

  function submit(e) {
    e.preventDefault();
    onSave(draft);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />
      <motion.form
        ref={dialogRef}
        onSubmit={submit}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="solid shadow-[var(--shadow-overlay)] fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md flex-col gap-3 rounded-t-2xl p-5 pb-[max(1.25rem,var(--safe-b))]"
        role="dialog" aria-modal="true" aria-label="עריכת יעדים יומיים"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">יעדים יומיים</h2>
          <button type="button" onClick={onClose} className="press glass flex size-9 items-center justify-center rounded-xl" aria-label="סגור">
            <X className="size-4" />
          </button>
        </div>

        {fields.map((f) => (
          <label key={f.id} className="flex items-center justify-between gap-3 text-sm font-semibold">
            {f.label}
            <input
              type="number" inputMode="numeric" step={f.step} min={0}
              value={draft[f.id]}
              onChange={(e) => setDraft((d) => ({ ...d, [f.id]: e.target.value }))}
              className="tnum glass w-28 rounded-xl px-3 py-2.5 text-center text-sm font-bold outline-none"
            />
          </label>
        ))}

        <button type="submit" className="btn-volt press mt-1 rounded-2xl py-3.5 text-sm font-bold">
          שמור יעדים
        </button>
      </motion.form>
    </>
  );
}
