import { ArrowLeft, Copy, Droplets, Flame, LoaderCircle, Sparkles, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';

function remaining(value, target) {
  return Math.max(Number(target || 0) - Number(value || 0), 0);
}

export default function DailyPlanCard({
  date,
  totals,
  profile,
  hasMeals,
  copying,
  onCopyPreviousDay,
}) {
  const calories = remaining(totals.calories, profile.calorie_target);
  const protein = remaining(totals.protein, profile.protein_target);
  const water = remaining(totals.water_ml, profile.water_target_ml);
  const goalsComplete = calories === 0 && protein === 0 && water === 0;

  let guidance = 'התחל עם ארוחה עשירה בחלבון ובנה סביבה את שאר היום.';
  if (goalsComplete) {
    guidance = 'כל היעדים היומיים הושגו. עבודה יפה, עכשיו נשאר לשמור על עקביות.';
  } else if (protein > 40) {
    guidance = `כדאי שהארוחה הבאה תכלול לפחות ${Math.min(Math.ceil(protein), 60)} גרם חלבון.`;
  } else if (calories > 700) {
    guidance = 'נשאר פער קלורי משמעותי. עדיף לפצל אותו לשתי ארוחות נוחות.';
  } else if (water > 750) {
    guidance = 'התזונה כמעט במקום. התמקד עכשיו בהשלמת המים בהדרגה.';
  }

  return (
    <section className="glass fade-up overflow-hidden p-5" aria-label="תוכנית להמשך היום">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-slate-100">
            <Sparkles size={18} className="text-orange-300" aria-hidden="true" />
            מה נשאר להיום
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">{guidance}</p>
        </div>
        <Link
          to={`/add?date=${date}`}
          className="press flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-orange-500/15 px-3 py-2 text-xs font-bold text-orange-300"
        >
          הוסף ארוחה <ArrowLeft size={14} aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <PlanMetric Icon={Flame} value={Math.round(calories)} unit='קק"ל' label="קלוריות" color="text-orange-300" />
        <PlanMetric Icon={Utensils} value={Math.round(protein)} unit="גרם" label="חלבון" color="text-violet-300" />
        <PlanMetric Icon={Droplets} value={Math.round(water)} unit='מ"ל' label="מים" color="text-sky-300" />
      </div>

      {!hasMeals && (
        <button
          type="button"
          onClick={onCopyPreviousDay}
          disabled={copying}
          className="press mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50"
        >
          {copying ? <LoaderCircle size={17} className="animate-spin" /> : <Copy size={17} />}
          {copying ? 'מעתיק ארוחות...' : 'העתק את כל הארוחות מהיום הקודם'}
        </button>
      )}
    </section>
  );
}

function PlanMetric({ Icon, value, unit, label, color }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-3 text-center">
      <Icon size={18} className={`mx-auto ${color}`} aria-hidden="true" />
      <div className="mt-1.5 text-xl font-extrabold tabular-nums text-slate-50">{value}</div>
      <div className="text-[10px] font-medium text-slate-500">{unit} {label}</div>
    </div>
  );
}
