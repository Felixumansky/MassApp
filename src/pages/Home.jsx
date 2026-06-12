import { useCallback, useEffect, useState } from 'react';
import { api, todayStr } from '../api.js';
import CalorieRing from '../components/CalorieRing.jsx';
import MacroBar from '../components/MacroBar.jsx';
import WaterTracker from '../components/WaterTracker.jsx';
import MealList from '../components/MealList.jsx';
import { Dumbbell, RefreshCw } from 'lucide-react';

function motivation(pct) {
  if (pct >= 100) return 'מפלצת! היעד הושג 🏆';
  if (pct >= 75) return 'כמעט שם, עוד דחיפה קטנה 🔥';
  if (pct >= 50) return 'חצי דרך מאחוריך, ממשיכים חזק 💪';
  if (pct >= 25) return 'התחלה טובה — המסה נבנית ארוחה אחרי ארוחה';
  return 'יום חדש, מסה חדשה. בוא נאכל! 🍗';
}

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const date = todayStr();

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await api.summary(date));
    } catch (err) {
      setError(err.message);
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
      <div className="space-y-4 animate-pulse" aria-label="טוען...">
        <div className="glass h-64" />
        <div className="glass h-40" />
        <div className="glass h-32" />
      </div>
    );
  }

  const { profile, meals, water, totals } = data;
  const pct = profile.calorie_target > 0 ? (totals.calories / profile.calorie_target) * 100 : 0;
  const dayName = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

  const addWater = async (ml) => {
    await api.water.create({ date, amount_ml: ml });
    load();
  };
  const removeWater = async (id) => {
    await api.water.remove(id);
    load();
  };
  const removeMeal = async (id) => {
    await api.meals.remove(id);
    load();
  };

  return (
    <div className="space-y-4">
      <header className="fade-up flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">
            שלום, <span className="gradient-text">{profile.name || 'אלוף'}</span>
          </h1>
          <p className="text-sm text-slate-400">{dayName}</p>
        </div>
        <div className="btn-fire flex h-12 w-12 items-center justify-center rounded-2xl text-white">
          <Dumbbell size={24} aria-hidden="true" />
        </div>
      </header>

      <div className="space-y-4 lg:grid lg:grid-cols-5 lg:gap-4 lg:space-y-0">
        <section
          className="glass fade-up flex flex-col items-center justify-center p-6 lg:col-span-2 lg:row-span-2"
          aria-label="קלוריות היום"
        >
          <CalorieRing consumed={totals.calories} target={profile.calorie_target} />
          <p className="mt-2 text-center text-sm font-medium text-slate-300">{motivation(pct)}</p>
        </section>

        <section className="glass fade-up space-y-4 p-5 lg:col-span-3" aria-label="אבות מזון">
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

      <h2 className="fade-up pt-2 text-lg font-bold text-slate-200">הארוחות של היום</h2>
      <MealList meals={meals} onRemove={removeMeal} />
    </div>
  );
}
