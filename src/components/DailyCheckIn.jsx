import { useEffect, useState } from 'react';
import { BedDouble, Check, Dumbbell, Save, Utensils } from 'lucide-react';
import { api } from '../api.js';

const EMPTY = { trained: false, sleep_hours: '', appetite: 3, note: '', muscles: [] };

const MUSCLE_GROUPS = [
  { id: 'chest',     label: 'חזה',       emoji: '🏋️' },
  { id: 'back',      label: 'גב',        emoji: '🔙' },
  { id: 'shoulders', label: 'כתפיים',    emoji: '🤷' },
  { id: 'biceps',    label: 'ביספס',     emoji: '💪' },
  { id: 'triceps',   label: 'טריספס',    emoji: '🦾' },
  { id: 'legs',      label: 'רגליים',    emoji: '🦵' },
  { id: 'glutes',    label: 'ישבן',      emoji: '🍑' },
  { id: 'core',      label: 'בטן / ליבה', emoji: '🎯' },
];

export default function DailyCheckIn({ date }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setSaved(false);
    api.checkins
      .get(date)
      .then((data) => {
        if (!active) return;
        setForm(data ? {
          trained: data.trained,
          sleep_hours: data.sleep_hours ?? '',
          appetite: data.appetite ?? 3,
          note: data.note ?? '',
          muscles: data.muscles ?? [],
        } : EMPTY);
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [date]);

  const toggleTrained = () => {
    setForm((f) => ({ ...f, trained: !f.trained, muscles: f.trained ? [] : f.muscles }));
  };

  const toggleMuscle = (id) => {
    setForm((f) => ({
      ...f,
      muscles: f.muscles.includes(id) ? f.muscles.filter((m) => m !== id) : [...f.muscles, id],
    }));
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.checkins.update({ date, ...form });
      setForm({
        trained: updated.trained,
        sleep_hours: updated.sleep_hours ?? '',
        appetite: updated.appetite ?? 3,
        note: updated.note ?? '',
        muscles: updated.muscles ?? [],
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass fade-up p-5" aria-label="צ'ק־אין יומי">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-100">צ'ק־אין יומי</h2>
          <p className="text-xs text-slate-400">האוכל הוא רק חלק מהתמונה</p>
        </div>
        <button
          type="button"
          onClick={toggleTrained}
          disabled={loading}
          className={`press flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-sm font-semibold ${
            form.trained
              ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-300'
              : 'border-white/10 bg-white/5 text-slate-400'
          }`}
        >
          <Dumbbell size={17} />
          {form.trained ? 'התאמנתי' : 'יום מנוחה'}
        </button>
      </div>

      {loading ? (
        <div className="h-28 animate-pulse rounded-2xl bg-white/5" />
      ) : (
        <div className="space-y-4">

          {form.trained && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <Dumbbell size={14} />
                על אילו שרירים עבדת?
              </p>
              <div className="grid grid-cols-4 gap-2">
                {MUSCLE_GROUPS.map(({ id, label, emoji }) => {
                  const active = form.muscles.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleMuscle(id)}
                      className={`press flex flex-col items-center gap-1 rounded-2xl border py-2.5 px-1 text-center transition-colors ${
                        active
                          ? 'border-emerald-400/60 bg-emerald-400/20 text-emerald-200'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-lg leading-none">{emoji}</span>
                      <span className="text-[10px] font-medium leading-tight">{label}</span>
                    </button>
                  );
                })}
              </div>
              {form.muscles.length > 0 && (
                <p className="mt-3 text-xs text-emerald-400/80">
                  ✓ {form.muscles.map((id) => MUSCLE_GROUPS.find((m) => m.id === id)?.label).join(' · ')}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="rounded-2xl bg-white/5 p-3">
              <span className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
                <BedDouble size={15} className="text-sky-300" /> שעות שינה
              </span>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={form.sleep_hours}
                onChange={(e) => setForm({ ...form, sleep_hours: e.target.value })}
                placeholder="7.5"
                className="w-full bg-transparent text-center text-xl font-bold text-slate-100 outline-none"
              />
            </label>

            <div className="rounded-2xl bg-white/5 p-3">
              <span className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
                <Utensils size={15} className="text-orange-300" /> תיאבון
              </span>
              <div className="flex justify-between" role="radiogroup" aria-label="דירוג תיאבון">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={form.appetite === value}
                    onClick={() => setForm({ ...form, appetite: value })}
                    className={`press h-8 w-8 rounded-full text-sm font-bold ${
                      form.appetite === value ? 'bg-orange-500 text-white' : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            maxLength={500}
            rows={2}
            placeholder="איך הרגשת היום? משהו שכדאי לזכור..."
            className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400/60"
          />

          {error && <p className="text-sm text-rose-300">{error}</p>}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={`press flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-bold text-white ${
              saved ? 'bg-emerald-500' : 'btn-fire'
            } disabled:opacity-50`}
          >
            {saved ? <Check size={18} /> : <Save size={18} />}
            {saved ? "הצ'ק־אין נשמר" : saving ? 'שומר...' : "שמירת צ'ק־אין"}
          </button>
        </div>
      )}
    </section>
  );
}
