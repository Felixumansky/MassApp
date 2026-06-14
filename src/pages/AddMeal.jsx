import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, todayStr } from '../api.js';
import { MEAL_TYPES } from '../components/MealList.jsx';
import { ArrowRight, Search, Check, PencilLine } from 'lucide-react';

export default function AddMeal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedDate = searchParams.get('date') || todayStr();
  const [foods, setFoods] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [manual, setManual] = useState(false);
  const [manualFood, setManualFood] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [saving, setSaving] = useState(false);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(() => {
      setError(null);
      setLoadingFoods(true);
      api.foods
        .list(query.trim(), controller.signal)
        .then((results) => {
          if (active) setFoods(results);
        })
        .catch((err) => {
          if (active && err.name !== 'AbortError') setError(err.message);
        })
        .finally(() => {
          if (active) setLoadingFoods(false);
        });
    }, query.trim() ? 300 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const calc = useMemo(() => {
    if (!selected || !amount) return null;
    const factor = Number(amount) / 100;
    return {
      calories: selected.calories_per_100 * factor,
      protein: selected.protein_per_100 * factor,
      carbs: selected.carbs_per_100 * factor,
      fat: selected.fat_per_100 * factor,
    };
  }, [selected, amount]);

  const canSave = manual
    ? manualFood.name.trim() && Number(manualFood.calories) > 0
    : selected && Number(amount) > 0;

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      const body = manual
        ? {
            date: selectedDate,
            meal_type: mealType,
            food_name: manualFood.name.trim(),
            amount: null,
            calories: Number(manualFood.calories),
            protein: Number(manualFood.protein) || 0,
            carbs: Number(manualFood.carbs) || 0,
            fat: Number(manualFood.fat) || 0,
          }
        : {
            date: selectedDate,
            meal_type: mealType,
            food_name: selected.name,
            amount: Number(amount),
            unit: selected.unit,
            calories: Math.round(calc.calories),
            protein: Math.round(calc.protein * 10) / 10,
            carbs: Math.round(calc.carbs * 10) / 10,
            fat: Math.round(calc.fat * 10) / 10,
          };
      await api.meals.create(body);
      // הזנה ידנית נשמרת גם בתפריט (הקטלוג) כדי שתהיה זמינה לחיפוש בעתיד עם כל הפרטים.
      // best-effort: כישלון (למשל שם שכבר קיים) לא יבטל את שמירת הארוחה.
      if (manual) {
        api.foods
          .create({
            name: manualFood.name.trim(),
            calories_per_100: Number(manualFood.calories),
            protein_per_100: Number(manualFood.protein) || 0,
            carbs_per_100: Number(manualFood.carbs) || 0,
            fat_per_100: Number(manualFood.fat) || 0,
            default_amount: 100,
            unit: 'גרם',
          })
          .catch(() => {});
      }
      navigate(`/?date=${selectedDate}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <header className="fade-up flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="press glass flex h-11 w-11 items-center justify-center !rounded-2xl text-slate-300"
          aria-label="חזרה"
        >
          <ArrowRight size={20} />
        </button>
        <h1 className="text-2xl font-extrabold">
          הוספת <span className="gradient-text">ארוחה</span>
        </h1>
        {selectedDate !== todayStr() && (
          <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-medium text-orange-300">
            {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('he-IL')}
          </span>
        )}
      </header>

      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
      <div className="space-y-4">
      {/* סוג ארוחה */}
      <div className="fade-up grid grid-cols-4 gap-2" role="radiogroup" aria-label="סוג ארוחה">
        {MEAL_TYPES.map(({ key, label, Icon }) => (
          <button
            key={key}
            role="radio"
            aria-checked={mealType === key}
            onClick={() => setMealType(key)}
            className={`press flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl border p-2 text-[11px] font-medium transition-colors ${
              mealType === key
                ? 'border-orange-400/60 bg-orange-500/15 text-orange-300'
                : 'border-white/10 bg-white/5 text-slate-400'
            }`}
          >
            <Icon size={20} aria-hidden="true" />
            {label.replace('ארוחת ', '').replace(' / נשנוש', '')}
          </button>
        ))}
      </div>

      {/* מעבר בין קטלוג להזנה ידנית */}
      <div className="fade-up glass flex p-1.5 text-sm font-medium">
        <button
          onClick={() => setManual(false)}
          className={`press flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 ${!manual ? 'btn-fire text-white' : 'text-slate-400'}`}
        >
          <Search size={16} /> מהקטלוג
        </button>
        <button
          onClick={() => setManual(true)}
          className={`press flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 ${manual ? 'btn-fire text-white' : 'text-slate-400'}`}
        >
          <PencilLine size={16} /> ידני
        </button>
      </div>

      {error && <p className="fade-up rounded-2xl bg-rose-500/15 p-3 text-sm text-rose-300">{error}</p>}

      {!manual ? (
        <>
          <div className="fade-up relative">
            <Search size={18} className="absolute top-1/2 -translate-y-1/2 start-4 text-slate-500" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חפש מאכל... (חזה עוף, אורז, קוטג')"
              className="glass w-full !rounded-2xl border-none bg-transparent py-3.5 ps-12 pe-4 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400/60"
              aria-label="חיפוש מאכל"
            />
          </div>

          <ul className="fade-up max-h-72 space-y-2 overflow-y-auto pe-1 lg:max-h-[28rem]">
            {loadingFoods && (
              <li className="glass p-5 text-center text-sm text-slate-400" role="status">
                טוען מאכלים...
              </li>
            )}
            {foods.map((f) => (
              <li key={f.id}>
                <button
                  onClick={() => {
                    setSelected(f);
                    setAmount(String(f.default_amount));
                  }}
                  className={`press w-full rounded-2xl border p-3.5 text-start transition-colors ${
                    selected?.id === f.id
                      ? 'border-orange-400/60 bg-orange-500/15'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-100">{f.name}</span>
                    {selected?.id === f.id && <Check size={18} className="text-orange-400" />}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400 tabular-nums">
                    {f.calories_per_100} קק"ל · ח {f.protein_per_100} · פ {f.carbs_per_100} · ש {f.fat_per_100} (ל-100 {f.unit})
                  </p>
                </button>
              </li>
            ))}
            {!loadingFoods && foods.length === 0 && (
              <li className="glass p-5 text-center text-sm text-slate-400">
                לא נמצא "{query}" — נסה הזנה ידנית
              </li>
            )}
          </ul>

        </>
      ) : (
        <div className="fade-up glass space-y-3 p-4">
          <Field label="שם המאכל" value={manualFood.name} onChange={(v) => setManualFood({ ...manualFood, name: v })} type="text" />
          <div className="grid grid-cols-2 gap-3">
            <Field label='קלוריות (קק"ל)' value={manualFood.calories} onChange={(v) => setManualFood({ ...manualFood, calories: v })} />
            <Field label="חלבון (גרם)" value={manualFood.protein} onChange={(v) => setManualFood({ ...manualFood, protein: v })} />
            <Field label="פחמימות (גרם)" value={manualFood.carbs} onChange={(v) => setManualFood({ ...manualFood, carbs: v })} />
            <Field label="שומן (גרם)" value={manualFood.fat} onChange={(v) => setManualFood({ ...manualFood, fat: v })} />
          </div>
        </div>
      )}
      </div>

      {/* עמודה שנייה בדסקטופ: כמות + שמירה */}
      <div className="space-y-4">
        {!manual && selected && (
          <div className="fade-up glass space-y-3 p-4">
            <p className="font-semibold text-slate-200">{selected.name}</p>
            <label className="block text-sm font-medium text-slate-300" htmlFor="amount">
              כמות ({selected.unit})
            </label>
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 p-3.5 text-center text-2xl font-bold tabular-nums text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400/60"
            />
            {calc && (
              <div className="grid grid-cols-4 gap-2 text-center">
                <Stat label='קק"ל' value={Math.round(calc.calories)} highlight />
                <Stat label="חלבון" value={`${Math.round(calc.protein)}g`} />
                <Stat label="פחמ'" value={`${Math.round(calc.carbs)}g`} />
                <Stat label="שומן" value={`${Math.round(calc.fat)}g`} />
              </div>
            )}
          </div>
        )}

        {!manual && !selected && (
          <div className="glass hidden flex-col items-center gap-2 p-10 text-center lg:flex">
            <Search size={28} className="text-slate-500" aria-hidden="true" />
            <p className="text-sm text-slate-400">בחר מאכל מהרשימה כדי לקבוע כמות</p>
          </div>
        )}

        <button
          onClick={save}
          disabled={!canSave || saving}
          className="btn-fire press w-full rounded-2xl py-4 text-lg font-bold text-white disabled:opacity-40 disabled:shadow-none"
        >
          {saving ? 'שומר...' : 'הוסף לארוחות 🍽️'}
        </button>
      </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className={`rounded-xl p-2 ${highlight ? 'bg-orange-500/15 text-orange-300' : 'bg-white/5 text-slate-300'}`}>
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[11px] text-slate-400">{label}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'number' }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-300">{label}</label>
      <input
        type={type}
        inputMode={type === 'number' ? 'decimal' : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400/60"
      />
    </div>
  );
}
