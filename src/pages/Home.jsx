import { useCallback, useEffect, useRef, useState } from 'react';
import { api, todayStr } from '../api.js';
import CalorieRing from '../components/CalorieRing.jsx';
import MacroBar from '../components/MacroBar.jsx';
import WaterTracker from '../components/WaterTracker.jsx';
import MealList from '../components/MealList.jsx';
import DailyCheckIn from '../components/DailyCheckIn.jsx';
import DailyPlanCard from '../components/DailyPlanCard.jsx';
import { ChevronLeft, ChevronRight, Dumbbell, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

function motivation(pct) {
  if (pct >= 100) return 'מפלצת! היעד הושג 🏆';
  if (pct >= 75) return 'כמעט שם, עוד דחיפה קטנה 🔥';
  if (pct >= 50) return 'חצי דרך מאחוריך, ממשיכים חזק 💪';
  if (pct >= 25) return 'התחלה טובה — המסה נבנית ארוחה אחרי ארוחה';
  return 'יום חדש, מסה חדשה. בוא נאכל! 🍗';
}

function shiftDate(date, offset) {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + offset);
  return next.toLocaleDateString('en-CA');
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [copyingDay, setCopyingDay] = useState(false);
  const loadRequest = useRef(0);
  const date = searchParams.get('date') || todayStr();

  const load = useCallback(async () => {
    const requestId = ++loadRequest.current;
    try {
      setError(null);
      setData(null);
      const summary = await api.summary(date);
      if (requestId === loadRequest.current) setData(summary);
    } catch (err) {
      if (requestId === loadRequest.current) setError(err.message);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="glass fade-up mt-10 flex flex-col items-center gap-4 p-8 text-center">
        <p className="font-medium text-rose-300">{error}</p>
        <button onClick={load} className="btn-fire press flex items-center gap-2 rounded-full px-6 py-2.5 font-semibold text-white">
          <RefreshCw size={16} /> נסה שוב
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4" aria-label="טוען..." role="status">
        <div className="skeleton glass h-64" />
        <div className="skeleton glass h-40" />
        <div className="skeleton glass h-32" />
      </div>
    );
  }

  const { profile, meals, water, totals } = data;
  const pct = profile.calorie_target > 0 ? (totals.calories / profile.calorie_target) * 100 : 0;
  const dayName = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

  const addWater = async (ml) => {
    try {
      setActionError(null);
      await api.water.create({ date, amount_ml: ml });
      load();
    } catch (err) {
      setActionError(err.message);
    }
  };
  const removeWater = async (id) => {
    try {
      setActionError(null);
      await api.water.remove(id);
      load();
    } catch (err) {
      setActionError(err.message);
    }
  };
  const removeMeal = async (id) => {
    try {
      setActionError(null);
      await api.meals.remove(id);
      load();
    } catch (err) {
      setActionError(err.message);
    }
  };
  const duplicateMeal = async (id) => {
    try {
      setActionError(null);
      await api.meals.duplicate(id, todayStr());
      if (date === todayStr()) load();
      return true;
    } catch (err) {
      setActionError(err.message);
      return false;
    }
  };
  const copyPreviousDay = async () => {
    if (copyingDay) return;
    setCopyingDay(true);
    setActionError(null);
    try {
      await api.meals.duplicateDay(shiftDate(date, -1), date);
      await load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setCopyingDay(false);
    }
  };
  const moveDate = (offset) => {
    setSearchParams({ date: shiftDate(date, offset) });
  };
  const isToday = date === todayStr();
  const displayDate = new Date(`${date}T12:00:00`).toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="space-y-4">
      <header className="fade-up flex items-center justify-between gap-3 pe-14 lg:pe-0">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-300/70">MassApp</p>
          <h1 className="mt-0.5 text-3xl font-extrabold leading-tight">
            שלום, <span className="gradient-text">{profile.name || 'אלוף'}</span>
          </h1>
          <p className="mt-0.5 text-sm text-slate-400">{isToday ? dayName : displayDate}</p>
        </div>
        <div className="btn-fire hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white lg:flex">
          <Dumbbell size={24} aria-hidden="true" />
        </div>
      </header>

      <div className="glass fade-up flex items-center justify-between p-2" style={{ '--d': '0.05s' }}>
        <button
          onClick={() => moveDate(-1)}
          className="press flex h-11 w-11 items-center justify-center rounded-2xl text-slate-300 hover:bg-white/5"
          aria-label="היום הקודם"
        >
          <ChevronRight size={20} />
        </button>
        <button
          onClick={() => setSearchParams({ date: todayStr() })}
          className="press rounded-2xl px-4 py-2 text-center"
        >
          <span className="block text-sm font-bold text-slate-100">{isToday ? 'היום' : displayDate}</span>
          {!isToday && <span className="text-[11px] text-orange-300">חזרה להיום</span>}
        </button>
        <button
          onClick={() => moveDate(1)}
          disabled={isToday}
          className="press flex h-11 w-11 items-center justify-center rounded-2xl text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-25"
          aria-label="היום הבא"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="space-y-4 lg:grid lg:grid-cols-5 lg:gap-4 lg:space-y-0">
        <section
          className="glass fade-up flex flex-col items-center justify-center p-6 lg:col-span-2 lg:row-span-2"
          style={{ '--d': '0.1s' }}
          aria-label="קלוריות היום"
        >
          <CalorieRing consumed={totals.calories} target={profile.calorie_target} />
          <p className="mt-2 text-center text-sm font-medium text-slate-300">{motivation(pct)}</p>
        </section>

        <section className="glass fade-up space-y-4 p-5 lg:col-span-3" style={{ '--d': '0.16s' }} aria-label="אבות מזון">
          <MacroBar label="חלבון 🥩" value={totals.protein} target={profile.protein_target} color="linear-gradient(90deg,#a78bfa,#8b5cf6)" />
          <MacroBar label="פחמימות 🍚" value={totals.carbs} target={profile.carbs_target} color="linear-gradient(90deg,#fbbf24,#f59e0b)" />
          <MacroBar label="שומן 🥑" value={totals.fat} target={profile.fat_target} color="linear-gradient(90deg,#34d399,#10b981)" />
        </section>

        <div className="lg:col-span-3">
          <WaterTracker
            totalMl={totals.water_ml}
            targetMl={profile.water_target_ml}
            logs={water}
            onAdd={addWater}
            onRemove={removeWater}
          />
        </div>
      </div>

      <DailyPlanCard
        date={date}
        totals={totals}
        profile={profile}
        hasMeals={meals.length > 0}
        copying={copyingDay}
        onCopyPreviousDay={copyPreviousDay}
      />

      <DailyCheckIn date={date} />

      <h2 className="fade-up pt-2 text-lg font-bold text-slate-200">
        {isToday ? 'הארוחות של היום' : 'הארוחות ביום הזה'}
      </h2>
      {actionError && (
        <p className="fade-up rounded-2xl bg-rose-500/15 p-3 text-sm text-rose-300">{actionError}</p>
      )}
      <MealList
        meals={meals}
        onRemove={removeMeal}
        onDuplicate={duplicateMeal}
        addDate={date}
      />
    </div>
  );
}
