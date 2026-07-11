import { useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDialogFocus } from '../lib/useDialogFocus.js';
import { MEAL_TYPES } from '../lib/nutritionAnalytics.js';

/* מסך אישור ועריכה של פירוק תזונתי — לפני שמירה ליומן.
   הערכות AI מתמונה סוטות בקלות, לכן שינוי כמות מעדכן קלוריות/מאקרו
   פרופורציונלית (לפי הערכים-ליחידה שנגזרו מהפריט המקורי). */

const CONFIDENCE = {
  high: { label: 'ודאות גבוהה', color: '#34D399' },
  medium: { label: 'ודאות בינונית', color: '#FBBF24' },
  low: { label: 'ניחוש', color: '#F87171' },
};

const r1 = (n) => Math.round(n * 10) / 10;

/** סוג ארוחה מוצע לפי השעה הנוכחית. */
export function suggestedMealType(hour = new Date().getHours()) {
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snack';
}

/** ממיר פריט לשורה עריכה עם ערכי בסיס-ליחידת-כמות לחישוב פרופורציונלי. */
function toRow(item, i) {
  const amount = Number(item.amount) || 0;
  const per = (v) => (amount > 0 ? (Number(v) || 0) / amount : 0);
  return {
    key: i + '-' + (item.name || ''),
    name: item.name || '',
    amount,
    unit: item.unit || 'גרם',
    calories: Math.round(Number(item.calories) || 0),
    protein: r1(Number(item.protein) || 0),
    carbs: r1(Number(item.carbs) || 0),
    fat: r1(Number(item.fat) || 0),
    confidence: item.confidence,
    base: { calories: per(item.calories), protein: per(item.protein), carbs: per(item.carbs), fat: per(item.fat) },
  };
}

export default function AnalysisReview({
  title = 'מה זיהינו',
  initialItems = [],
  initialMealType,
  photo,
  notes,
  saveLabel = 'שמור ליומן',
  onSave,
  onCancel,
  onDelete,
}) {
  const [rows, setRows] = useState(() => initialItems.map(toRow));
  const [mealType, setMealType] = useState(initialMealType || suggestedMealType());
  const dialogRef = useDialogFocus(true, onCancel);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, x) => ({
          calories: acc.calories + x.calories,
          protein: r1(acc.protein + x.protein),
          carbs: r1(acc.carbs + x.carbs),
          fat: r1(acc.fat + x.fat),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [rows]
  );

  function setAmount(key, amount) {
    const num = Number(amount) || 0;
    setRows((rs) =>
      rs.map((x) =>
        x.key === key
          ? {
              ...x,
              amount: amount === '' ? '' : num,
              calories: Math.round(x.base.calories * num),
              protein: r1(x.base.protein * num),
              carbs: r1(x.base.carbs * num),
              fat: r1(x.base.fat * num),
            }
          : x
      )
    );
  }

  function setName(key, name) {
    setRows((rs) => rs.map((x) => (x.key === key ? { ...x, name } : x)));
  }

  function removeRow(key) {
    setRows((rs) => rs.filter((x) => x.key !== key));
  }

  function addManualRow() {
    setRows((rs) => [
      ...rs,
      {
        key: 'manual-' + Date.now(),
        name: '',
        amount: 100,
        unit: 'גרם',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        manual: true, // שורה ידנית — הערכים מוזנים ישירות, לא נגזרים מכמות
        base: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      },
    ]);
  }

  function setManualField(key, field, value) {
    setRows((rs) =>
      rs.map((x) => (x.key === key ? { ...x, [field]: value === '' ? '' : Number(value) } : x))
    );
  }

  function submit(e) {
    e.preventDefault();
    const items = rows
      .filter((x) => x.name.trim() && Number(x.calories) >= 0)
      .map((x) => ({
        name: x.name.trim(),
        amount: Number(x.amount) || 0,
        unit: x.unit,
        calories: Math.round(Number(x.calories) || 0),
        protein: r1(Number(x.protein) || 0),
        carbs: r1(Number(x.carbs) || 0),
        fat: r1(Number(x.fat) || 0),
      }));
    if (!items.length) return;
    onSave({ items, mealType });
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />
      <motion.form
        ref={dialogRef}
        onSubmit={submit}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="solid shadow-[var(--shadow-overlay)] fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] max-w-md flex-col gap-3 overflow-y-auto rounded-t-2xl p-5 pb-[max(1.25rem,var(--safe-b))]"
        role="dialog" aria-modal="true" aria-label={title}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onCancel} className="press glass flex size-9 items-center justify-center rounded-xl" aria-label="סגור">
            <X className="size-4" />
          </button>
        </div>

        {photo && <img src={photo} alt="תמונת הארוחה" className="h-36 w-full rounded-2xl object-cover" />}
        {notes && <p className="rounded-xl bg-white/[0.04] px-3 py-2 text-xs font-semibold text-[var(--color-muted-foreground)]">{notes}</p>}

        {/* בחירת סוג ארוחה */}
        <div className="flex gap-1.5" role="radiogroup" aria-label="סוג ארוחה">
          {MEAL_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setMealType(t.id)}
              role="radio"
              aria-checked={mealType === t.id}
              className="press flex-1 rounded-xl py-2 text-xs font-bold"
              style={{
                background: mealType === t.id ? 'rgba(249,115,22,0.18)' : 'rgba(255,255,255,0.04)',
                color: mealType === t.id ? '#fdba74' : '#94a3b8',
              }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* פריטים */}
        <ul className="flex flex-col gap-2">
          {rows.map((x) => (
            <li key={x.key} className="glass flex flex-col gap-2 rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <input
                  value={x.name}
                  onChange={(e) => setName(x.key, e.target.value)}
                  placeholder="שם המאכל"
                  className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
                  aria-label="שם המאכל"
                />
                {x.confidence && (
                  <span
                    className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ color: CONFIDENCE[x.confidence]?.color, background: 'rgba(255,255,255,0.05)' }}
                  >
                    {CONFIDENCE[x.confidence]?.label}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeRow(x.key)}
                  className="press flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-muted-foreground)]"
                  aria-label={`הסר את ${x.name || 'הפריט'}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
                  כמות
                  <input
                    type="number" inputMode="decimal" min={0}
                    value={x.amount}
                    onChange={(e) => (x.manual ? setManualField(x.key, 'amount', e.target.value) : setAmount(x.key, e.target.value))}
                    className="tnum glass w-20 rounded-lg px-2 py-1.5 text-center text-sm font-bold outline-none"
                    aria-label="כמות"
                  />
                  {x.unit}
                </label>
                <span className="tnum ms-auto text-sm font-extrabold" style={{ color: '#fb923c' }}>
                  {x.manual ? (
                    <input
                      type="number" inputMode="numeric" min={0}
                      value={x.calories}
                      onChange={(e) => setManualField(x.key, 'calories', e.target.value)}
                      className="tnum glass w-20 rounded-lg px-2 py-1.5 text-center text-sm font-bold outline-none"
                      aria-label="קלוריות"
                    />
                  ) : (
                    x.calories
                  )}{' '}
                  <span className="text-[10px] font-semibold text-[var(--color-muted-foreground)]">קק״ל</span>
                </span>
              </div>

              {x.manual ? (
                <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--color-muted-foreground)]">
                  {[['protein', '🟣 חלבון'], ['carbs', '🟡 פחמ׳'], ['fat', '🟢 שומן']].map(([f, label]) => (
                    <label key={f} className="flex flex-1 items-center gap-1">
                      {label}
                      <input
                        type="number" inputMode="decimal" min={0}
                        value={x[f]}
                        onChange={(e) => setManualField(x.key, f, e.target.value)}
                        className="tnum glass w-full min-w-0 rounded-lg px-1.5 py-1 text-center text-xs font-bold outline-none"
                        aria-label={label}
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <p className="tnum text-[11px] font-semibold text-[var(--color-muted-foreground)]">
                  🟣 חלבון {x.protein} · 🟡 פחמימות {x.carbs} · 🟢 שומן {x.fat} גר׳
                </p>
              )}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={addManualRow}
          className="press glass flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-[var(--color-muted-foreground)]"
        >
          <Plus className="size-4" />
          הוספת פריט ידנית
        </button>

        {/* טוטאל חי */}
        <div className="glass-strong flex items-center justify-between rounded-2xl px-4 py-3">
          <span className="text-sm font-bold">סה״כ</span>
          <span className="tnum text-sm font-bold text-[var(--color-muted-foreground)]">
            🟣 {totals.protein} · 🟡 {totals.carbs} · 🟢 {totals.fat}
          </span>
          <span className="tnum text-lg font-extrabold" style={{ color: '#fb923c' }}>
            {totals.calories} <span className="text-xs font-semibold text-[var(--color-muted-foreground)]">קק״ל</span>
          </span>
        </div>

        <div className="flex gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="press rounded-2xl bg-rose-500/90 px-4 py-3.5 text-sm font-bold text-white"
              aria-label="מחק ארוחה"
            >
              <Trash2 className="size-4" />
            </button>
          )}
          <button type="submit" disabled={!rows.length} className="btn-volt press flex-1 rounded-2xl py-3.5 text-sm font-bold disabled:opacity-50">
            {saveLabel}
          </button>
        </div>
      </motion.form>
    </>
  );
}
