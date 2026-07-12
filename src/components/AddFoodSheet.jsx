import { useMemo, useRef, useState } from 'react';
import { Camera, Keyboard, Mic, Plus, Search, Sparkles, Square, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store.jsx';
import { useCloud } from '../cloud.jsx';
import { api } from '../lib/api.js';
import { compressImage, vibrate } from '../lib/utils.js';
import { useDialogFocus } from '../lib/useDialogFocus.js';
import { useSpeech } from '../lib/useSpeech.js';
import { searchFoods, foodValues } from '../lib/foodsCatalog.js';
import AnalysisReview from './AnalysisReview.jsx';

/* גיליון הוספת ארוחה — שלושה מסלולים:
   📷 תמונה → ניתוח AI, 🎤 קול → תמלול → ניתוח AI, ⌨️ הקלדה → קטלוג (לוקלי) או תיאור חופשי (AI).
   כל המסלולים מסתיימים ב-AnalysisReview לאישור לפני שמירה. */

const MODES = [
  { id: 'photo', label: 'תמונה', icon: Camera },
  { id: 'voice', label: 'קול', icon: Mic },
  { id: 'type', label: 'הקלדה', icon: Keyboard },
];

export default function AddFoodSheet({ onClose, onSaved, date }) {
  const { state, dispatch } = useStore();
  const { token } = useCloud();
  const speech = useSpeech();

  const [mode, setMode] = useState('photo');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // תוצאת ניתוח שממתינה לאישור: { items, notes, source, photoThumb }
  const [review, setReview] = useState(null);

  const dialogRef = useDialogFocus(!review, onClose);
  const fileRef = useRef(null);

  async function analyze({ image, text, source, photoThumb }) {
    setBusy(true);
    setError('');
    try {
      const res = await api.analyzeFood(token, { image, text });
      if (!res.items?.length) {
        setError(res.notes || 'לא זוהה מאכל. נסו תמונה ברורה יותר או תיאור מפורט.');
        return;
      }
      setReview({ items: res.items, notes: res.notes, source, photoThumb });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function onPickPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // מאפשר לבחור שוב את אותו קובץ
    if (!file) return;
    setBusy(true);
    setError('');
    const [full, thumb] = await Promise.all([
      compressImage(file, 1024, 0.7),
      compressImage(file, 240, 0.6),
    ]);
    if (!full) {
      setBusy(false);
      setError('קריאת התמונה נכשלה. נסו שוב.');
      return;
    }
    await analyze({ image: full, source: 'photo', photoThumb: thumb || undefined });
  }

  function saveMeal({ items, mealType }) {
    vibrate(10);
    dispatch({
      type: 'addMeal',
      meal: { items, mealType, source: review.source, photo: review.photoThumb, ...(date ? { date } : null) },
    });
    onSaved();
  }

  return (
    <>
      {/* מסך אישור — מעל הגיליון */}
      <AnimatePresence>
        {review && (
          <AnalysisReview
            title="מה זיהינו"
            initialItems={review.items}
            notes={review.notes}
            photo={review.photoThumb}
            onCancel={() => setReview(null)}
            onSave={saveMeal}
          />
        )}
      </AnimatePresence>

      {!review && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            ref={dialogRef}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="solid shadow-[var(--shadow-overlay)] fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] max-w-md flex-col gap-3 overflow-y-auto rounded-t-2xl p-5 pb-[max(1.25rem,var(--safe-b))]"
            role="dialog" aria-modal="true" aria-label="הוספת ארוחה"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">הוספת ארוחה</h2>
              <button type="button" onClick={onClose} className="press glass flex size-9 items-center justify-center rounded-xl" aria-label="סגור">
                <X className="size-4" />
              </button>
            </div>

            {/* בחירת מסלול */}
            <div className="flex gap-1.5" role="tablist" aria-label="דרך הוספה">
              {MODES.filter((m) => m.id !== 'voice' || speech.supported).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={mode === m.id}
                  onClick={() => { vibrate(5); setMode(m.id); setError(''); }}
                  className="press flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold"
                  style={{
                    background: mode === m.id ? 'rgba(249,115,22,0.18)' : 'rgba(255,255,255,0.04)',
                    color: mode === m.id ? '#fdba74' : '#94a3b8',
                  }}
                >
                  <m.icon className="size-4" />
                  {m.label}
                </button>
              ))}
            </div>

            {error && (
              <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300" role="alert">
                {error}
              </p>
            )}

            {busy ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <span className="flex size-14 items-center justify-center rounded-3xl bg-orange-500/15">
                  <Sparkles className="size-6 animate-pulse text-orange-400" />
                </span>
                <p className="text-sm font-bold">מנתחים את הארוחה…</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">זה לוקח כמה שניות</p>
              </div>
            ) : (
              <>
                {mode === 'photo' && (
                  <PhotoMode fileRef={fileRef} onPick={onPickPhoto} />
                )}
                {mode === 'voice' && (
                  <VoiceMode speech={speech} onAnalyze={(text) => analyze({ text, source: 'voice' })} />
                )}
                {mode === 'type' && (
                  <TypeMode
                    customFoods={state.customFoods}
                    onAddCustomFood={(food) => dispatch({ type: 'addCustomFood', food })}
                    onAnalyzeText={(text) => analyze({ text, source: 'text' })}
                    onConfirmItems={(items) => setReview({ items, source: 'catalog' })}
                  />
                )}
              </>
            )}
          </motion.div>
        </>
      )}
    </>
  );
}

/* ═══ 📷 תמונה ═══ */
function PhotoMode({ fileRef, onPick }) {
  return (
    <div className="flex flex-col gap-3 py-2">
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPick} className="hidden" />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="press flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-white/15 py-10"
      >
        <span className="flex size-16 items-center justify-center rounded-3xl bg-orange-500/15">
          <Camera className="size-7 text-orange-400" />
        </span>
        <span className="text-sm font-bold">צלמו או בחרו תמונה של הצלחת</span>
        <span className="max-w-56 text-xs text-[var(--color-muted-foreground)]">
          ה-AI יזהה את המאכלים ויעריך קלוריות ומאקרו — תוכלו לתקן לפני השמירה
        </span>
      </button>
    </div>
  );
}

/* ═══ 🎤 קול ═══ */
function VoiceMode({ speech, onAnalyze }) {
  const { listening, transcript, error, start, stop, setTranscript } = speech;
  return (
    <div className="flex flex-col gap-3 py-2">
      <button
        type="button"
        onClick={() => { vibrate(8); listening ? stop() : start(); }}
        className="press mx-auto flex size-20 items-center justify-center rounded-full"
        style={{
          background: listening ? 'rgba(244,63,94,0.2)' : 'rgba(249,115,22,0.15)',
          boxShadow: listening ? '0 0 0 8px rgba(244,63,94,0.08)' : 'none',
        }}
        aria-label={listening ? 'עצור הקלטה' : 'התחל הקלטה'}
      >
        {listening ? (
          <Square className="size-7 text-rose-400" fill="currentColor" />
        ) : (
          <Mic className="size-8 text-orange-400" />
        )}
      </button>
      <p className="text-center text-xs font-semibold text-[var(--color-muted-foreground)]" aria-live="polite">
        {listening ? 'מקשיבים… תארו מה אכלתם' : 'לחצו ותארו בקול, למשל: "אכלתי חזה עוף עם אורז וסלט"'}
      </p>
      {error && <p className="text-center text-xs font-bold text-rose-300" role="alert">{error}</p>}
      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="התמלול יופיע כאן — אפשר גם לתקן ידנית"
        rows={3}
        className="glass w-full resize-none rounded-2xl px-4 py-3 text-sm font-semibold outline-none placeholder:text-[var(--color-muted-foreground)]"
        aria-label="תמלול הארוחה"
      />
      <button
        type="button"
        disabled={!transcript.trim()}
        onClick={() => onAnalyze(transcript.trim())}
        className="btn-volt press rounded-2xl py-3.5 text-sm font-bold disabled:opacity-50"
      >
        <Sparkles className="-mt-0.5 me-1 inline size-4" />
        נתחו עם AI
      </button>
    </div>
  );
}

/* ═══ ⌨️ הקלדה: חיפוש בקטלוג (לוקלי) או תיאור חופשי (AI) ═══ */
function TypeMode({ customFoods, onAddCustomFood, onAnalyzeText, onConfirmItems }) {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState(null); // { food, amount }
  const [cart, setCart] = useState([]); // פריטים שנבחרו מהקטלוג
  const [freeText, setFreeText] = useState('');
  const [addingFood, setAddingFood] = useState(false);

  const results = useMemo(() => searchFoods(query, customFoods).slice(0, 8), [query, customFoods]);

  function addToCart() {
    const { food, amount } = picked;
    const vals = foodValues(food, amount);
    setCart((c) => [...c, { name: food.name, amount: Number(amount), unit: food.unit, ...vals }]);
    setPicked(null);
    setQuery('');
  }

  return (
    <div className="flex flex-col gap-3 py-1">
      {/* חיפוש בקטלוג */}
      <label className="glass flex items-center gap-2 rounded-2xl px-4 py-3">
        <Search className="size-4 shrink-0 text-[var(--color-muted-foreground)]" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPicked(null); }}
          placeholder="חיפוש מאכל: חזה עוף, אורז, קוטג׳…"
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[var(--color-muted-foreground)]"
          aria-label="חיפוש בקטלוג המאכלים"
        />
      </label>

      {query && !picked && (
        <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
          {results.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => { vibrate(5); setPicked({ food: f, amount: f.defaultAmount }); }}
                className="press glass flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-start"
              >
                <span className="text-sm font-bold">{f.name}{f.custom ? ' ⭐' : ''}</span>
                <span className="tnum shrink-0 text-xs font-semibold text-[var(--color-muted-foreground)]">
                  {f.caloriesPer100} קק״ל / 100
                </span>
              </button>
            </li>
          ))}
          {!results.length && (
            <li className="px-3 py-2 text-center text-xs font-semibold text-[var(--color-muted-foreground)]">
              לא נמצא — נסו תיאור חופשי למטה או הוסיפו מאכל חדש
            </li>
          )}
        </ul>
      )}

      {/* בחירת כמות למאכל שנבחר */}
      {picked && (
        <div className="glass flex flex-col gap-2 rounded-2xl p-3">
          <p className="text-sm font-bold">{picked.food.name}</p>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
              כמות
              <input
                type="number" inputMode="decimal" min={0} autoFocus
                value={picked.amount}
                onChange={(e) => setPicked((p) => ({ ...p, amount: e.target.value }))}
                className="tnum glass w-20 rounded-lg px-2 py-1.5 text-center text-sm font-bold outline-none"
                aria-label="כמות בגרמים"
              />
              גרם
            </label>
            <span className="tnum ms-auto text-sm font-extrabold" style={{ color: '#fb923c' }}>
              {foodValues(picked.food, picked.amount).calories} קק״ל
            </span>
          </div>
          <button type="button" onClick={addToCart} className="btn-volt press rounded-xl py-2.5 text-xs font-bold">
            <Plus className="-mt-0.5 me-1 inline size-3.5" strokeWidth={3} />
            הוסף לארוחה
          </button>
        </div>
      )}

      {/* פריטים שנאספו */}
      {cart.length > 0 && (
        <div className="glass-strong flex flex-col gap-1.5 rounded-2xl p-3">
          {cart.map((it, i) => (
            <div key={i} className="flex items-center justify-between gap-2 text-sm">
              <span className="font-bold">{it.name}</span>
              <span className="tnum text-xs text-[var(--color-muted-foreground)]">
                {it.amount} {it.unit} · {it.calories} קק״ל
              </span>
              <button
                type="button"
                onClick={() => setCart((c) => c.filter((_, j) => j !== i))}
                className="press text-[var(--color-muted-foreground)]"
                aria-label={`הסר את ${it.name}`}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onConfirmItems(cart)}
            className="btn-volt press mt-1 rounded-xl py-2.5 text-sm font-bold"
          >
            המשך לאישור ({cart.reduce((s, it) => s + it.calories, 0)} קק״ל)
          </button>
        </div>
      )}

      {/* תיאור חופשי ל-AI */}
      <div className="mt-1 flex flex-col gap-2">
        <p className="text-xs font-bold text-[var(--color-muted-foreground)]">או תיאור חופשי:</p>
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder='למשל: "2 פרוסות לחם עם אבוקדו וביצת עין"'
          rows={2}
          className="glass w-full resize-none rounded-2xl px-4 py-3 text-sm font-semibold outline-none placeholder:text-[var(--color-muted-foreground)]"
          aria-label="תיאור חופשי של הארוחה"
        />
        <button
          type="button"
          disabled={!freeText.trim()}
          onClick={() => onAnalyzeText(freeText.trim())}
          className="press glass rounded-2xl py-3 text-sm font-bold disabled:opacity-50"
        >
          <Sparkles className="-mt-0.5 me-1 inline size-4 text-orange-400" />
          נתחו עם AI
        </button>
      </div>

      {/* הוספת מאכל לקטלוג */}
      {addingFood ? (
        <CustomFoodForm
          onSave={(food) => { onAddCustomFood(food); setAddingFood(false); }}
          onCancel={() => setAddingFood(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAddingFood(true)}
          className="press py-1 text-center text-xs font-bold text-[var(--color-muted-foreground)] underline-offset-2 hover:underline"
        >
          + הוספת מאכל חדש לקטלוג
        </button>
      )}
    </div>
  );
}

function CustomFoodForm({ onSave, onCancel }) {
  const [f, setF] = useState({ name: '', caloriesPer100: '', proteinPer100: '', carbsPer100: '', fatPer100: '', defaultAmount: 100 });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const fields = [
    ['caloriesPer100', 'קק״ל'],
    ['proteinPer100', 'חלבון'],
    ['carbsPer100', 'פחמ׳'],
    ['fatPer100', 'שומן'],
  ];
  return (
    <div className="glass flex flex-col gap-2 rounded-2xl p-3">
      <p className="text-sm font-bold">מאכל חדש (ערכים ל-100 גרם)</p>
      <input
        value={f.name} onChange={set('name')} placeholder="שם המאכל"
        className="glass rounded-xl px-3 py-2.5 text-sm font-bold outline-none placeholder:text-[var(--color-muted-foreground)]"
        aria-label="שם המאכל"
      />
      <div className="flex gap-2">
        {fields.map(([k, label]) => (
          <label key={k} className="flex min-w-0 flex-1 flex-col gap-1 text-[10px] font-bold text-[var(--color-muted-foreground)]">
            {label}
            <input
              type="number" inputMode="decimal" min={0}
              value={f[k]} onChange={set(k)}
              className="tnum glass w-full min-w-0 rounded-lg px-1.5 py-1.5 text-center text-xs font-bold outline-none"
              aria-label={`${label} ל-100 גרם`}
            />
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="press glass flex-1 rounded-xl py-2.5 text-xs font-bold">ביטול</button>
        <button
          type="button"
          disabled={!f.name.trim() || !f.caloriesPer100}
          onClick={() => onSave(f)}
          className="btn-volt press flex-1 rounded-xl py-2.5 text-xs font-bold disabled:opacity-50"
        >
          שמור לקטלוג
        </button>
      </div>
    </div>
  );
}
