import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { User, Target, Save, Check } from 'lucide-react';

const FIELDS = [
  { key: 'calorie_target', label: 'יעד קלוריות יומי', unit: 'קק"ל', color: 'text-orange-400' },
  { key: 'protein_target', label: 'יעד חלבון', unit: 'גרם', color: 'text-violet-400' },
  { key: 'carbs_target', label: 'יעד פחמימות', unit: 'גרם', color: 'text-amber-400' },
  { key: 'fat_target', label: 'יעד שומן', unit: 'גרם', color: 'text-emerald-400' },
  { key: 'water_target_ml', label: 'יעד מים', unit: 'מ"ל', color: 'text-sky-400' },
  { key: 'goal_weight', label: 'משקל יעד', unit: 'ק"ג', color: 'text-rose-400' },
];

export default function Profile() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.profile.get().then(setForm).catch((e) => setError(e.message));
  }, []);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const body = { name: form.name };
      for (const { key } of FIELDS) body[key] = form[key] === '' ? null : Number(form[key]);
      const updated = await api.profile.update(body);
      setForm(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (error && !form) {
    return <p className="glass fade-up mt-10 p-6 text-center text-rose-300">{error}</p>;
  }
  if (!form) {
    return (
      <div className="space-y-4 animate-pulse" aria-label="טוען...">
        <div className="glass h-24" />
        <div className="glass h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:max-w-2xl">
      <header className="fade-up flex items-center gap-3">
        <div className="btn-fire flex h-14 w-14 items-center justify-center rounded-2xl text-white">
          <User size={28} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">
            <span className="gradient-text">הפרופיל</span> שלי
          </h1>
          <p className="text-sm text-slate-400">היעדים שמגדירים את המסע</p>
        </div>
      </header>

      <section className="glass fade-up space-y-1 p-4">
        <label className="text-sm font-medium text-slate-300" htmlFor="name">איך לקרוא לך?</label>
        <input
          id="name"
          type="text"
          value={form.name || ''}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-2xl border border-white/10 bg-white/5 p-3.5 text-lg font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400/60"
        />
      </section>

      <section className="glass fade-up p-4" aria-label="יעדים יומיים">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-200">
          <Target size={18} className="text-orange-400" aria-hidden="true" /> יעדים יומיים
        </h2>
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-4 lg:space-y-0">
          {FIELDS.map(({ key, label, unit, color }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <label htmlFor={key} className="text-sm font-medium text-slate-300">
                {label} <span className={`text-xs ${color}`}>({unit})</span>
              </label>
              <input
                id={key}
                type="number"
                inputMode="decimal"
                value={form[key] ?? ''}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-28 rounded-xl border border-white/10 bg-white/5 p-2.5 text-center text-lg font-bold tabular-nums text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400/60"
              />
            </div>
          ))}
        </div>
      </section>

      {error && <p className="fade-up rounded-2xl bg-rose-500/15 p-3 text-sm text-rose-300">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className={`press flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white transition-all ${
          saved ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'btn-fire'
        } disabled:opacity-50`}
      >
        {saved ? (
          <>
            <Check size={20} /> נשמר!
          </>
        ) : (
          <>
            <Save size={20} /> {saving ? 'שומר...' : 'שמירת יעדים'}
          </>
        )}
      </button>

      <p className="fade-up pb-2 text-center text-xs text-slate-500">
        💡 טיפ לעלייה למסה: עודף של 300–500 קק"ל ביום ו-1.6–2.2 גרם חלבון לק"ג גוף
      </p>
    </div>
  );
}
