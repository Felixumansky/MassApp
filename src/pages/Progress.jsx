import { lazy, Suspense, useMemo, useState } from 'react';
import { Trophy, Dumbbell, Layers, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store.jsx';
import { PageHeader, GlassCard, EmptyState, AppLoader } from '../components/ui.jsx';
import { workoutVolume, epley1rm, shortDateHe, dayKey, vibrate, toUnit, fmtWeight, toKg, unitLabel } from '../lib/utils.js';
import { muscleById } from '../lib/exercises.js';

const VolumeChart = lazy(() => import('../components/ProgressCharts.jsx').then((m) => ({ default: m.VolumeChart })));
const WeightChart = lazy(() => import('../components/ProgressCharts.jsx').then((m) => ({ default: m.WeightChart })));

export default function Progress() {
  const { state, dispatch } = useStore();
  const { workouts, bodyWeights, profile } = state;
  const unit = profile.unit || 'kg';
  const [volExId, setVolExId] = useState('all');

  // Exercises that actually appear in logged workouts, for the volume picker.
  const volExercises = useMemo(() => {
    const map = new Map();
    for (const w of workouts) {
      for (const ex of w.exercises || []) {
        if (!map.has(ex.exerciseId)) map.set(ex.exerciseId, ex.name);
      }
    }
    return [...map].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'he'));
  }, [workouts]);

  const weekly = useMemo(() => {
    const volOf = (w) => {
      if (volExId === 'all') return workoutVolume(w);
      let v = 0;
      for (const ex of w.exercises || []) {
        if (ex.exerciseId !== volExId) continue;
        for (const s of ex.sets || []) {
          if (s.done && s.reps && s.weight) v += Number(s.reps) * Number(s.weight);
        }
      }
      return Math.round(v);
    };
    const buckets = [];
    for (let i = 7; i >= 0; i--) {
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const startKey = dayKey(new Date(end.getTime() - 6 * 864e5));
      const endKey = dayKey(end);
      const vol = workouts
        .filter((w) => w.date >= startKey && w.date <= endKey)
        .reduce((s, w) => s + volOf(w), 0);
      buckets.push({ label: shortDateHe(endKey), volume: Math.round(toUnit(vol, unit)) });
    }
    return buckets;
  }, [workouts, volExId, unit]);

  const weights = useMemo(
    () => bodyWeights.map((b) => ({ label: shortDateHe(b.date), weight: fmtWeight(b.weight, unit) })),
    [bodyWeights, unit]
  );

  const prs = useMemo(() => {
    const best = {};
    for (const w of workouts) {
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          if (!s.done || !s.weight || !s.reps) continue;
          const e1 = epley1rm(s.weight, s.reps);
          if (!best[ex.exerciseId] || e1 > best[ex.exerciseId].e1) {
            best[ex.exerciseId] = { name: ex.name, muscle: ex.muscle, e1, weight: Number(s.weight), reps: Number(s.reps) };
          }
        }
      }
    }
    return Object.values(best).sort((a, b) => b.e1 - a.e1).slice(0, 6);
  }, [workouts]);

  const totals = useMemo(
    () => ({
      workouts: workouts.length,
      volume: workouts.reduce((s, w) => s + workoutVolume(w), 0),
    }),
    [workouts]
  );

  if (workouts.length === 0) {
    return (
      <div>
        <PageHeader subtitle="נתונים" title="התקדמות" />
        <EmptyState icon={Trophy} title="אין נתונים עדיין" hint="השלם אימון אחד לפחות כדי לראות גרפים ושיאים." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader subtitle="נתונים" title="התקדמות" />

      <section className="grid grid-cols-2 gap-3">
        <GlassCard className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl" style={{ background: 'rgba(198,242,78,0.14)' }}>
            <Dumbbell className="size-5" style={{ color: 'var(--color-volt)' }} />
          </span>
          <div>
            <p className="tnum text-2xl font-extrabold leading-none">{totals.workouts}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">סה״כ אימונים</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl" style={{ background: 'rgba(56,189,248,0.14)' }}>
            <Layers className="size-5" style={{ color: 'var(--color-cyan)' }} />
          </span>
          <div>
            <p className="tnum text-2xl font-extrabold leading-none">{(toUnit(totals.volume, unit) / 1000).toFixed(1)}<span className="text-sm">{unit === 'lb' ? 'K' : 'ט׳'}</span></p>
            <p className="text-xs text-[var(--color-muted-foreground)]">נפח כולל</p>
          </div>
        </GlassCard>
      </section>

      <GlassCard>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="mb-1 font-bold">נפח שבועי</h2>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {volExId === 'all'
                ? `${unitLabel(unit)} מורמים ב‑8 השבועות האחרונים`
                : `${unitLabel(unit)} מורמים בתרגיל הנבחר ב‑8 השבועות האחרונים`}
            </p>
          </div>
          {volExercises.length > 0 && (
            <select
              value={volExId}
              onChange={(e) => setVolExId(e.target.value)}
              className="glass max-w-[48%] shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none [color-scheme:dark]"
              style={{ color: 'var(--color-foreground)' }}
              aria-label="בחירת תרגיל לגרף"
            >
              <option value="all" style={{ background: '#15181d', color: '#e7ecf1' }}>כל התרגילים</option>
              {volExercises.map((ex) => (
                <option key={ex.id} value={ex.id} style={{ background: '#15181d', color: '#e7ecf1' }}>{ex.name}</option>
              ))}
            </select>
          )}
        </div>
        <Suspense fallback={<AppLoader label="טוען גרף…" />}>
          <VolumeChart data={weekly} unit={unit} />
        </Suspense>
      </GlassCard>

      <GlassCard>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-bold">משקל גוף</h2>
            <p className="text-xs text-[var(--color-muted-foreground)]">מגמה לאורך זמן</p>
          </div>
          <AddWeightButton unit={unit} onAdd={(weight, date) => dispatch({ type: 'addBodyWeight', weight, date })} />
        </div>
        {weights.length > 0 ? (
          <Suspense fallback={<AppLoader label="טוען גרף…" />}>
            <WeightChart data={weights} unit={unit} />
          </Suspense>
        ) : (
          <p className="py-6 text-center text-sm text-[var(--color-muted-foreground)]">הוסף שקילה ראשונה</p>
        )}

        {bodyWeights.length > 0 && (
          <WeightHistory entries={bodyWeights} unit={unit} onDelete={(id) => dispatch({ type: 'deleteBodyWeight', id })} />
        )}
      </GlassCard>

      <section>
        <div className="mb-2 flex items-center gap-2">
          <Trophy className="size-4 text-[var(--color-amber)]" />
          <h2 className="font-bold">שיאים אישיים</h2>
          <span className="text-xs text-[var(--color-muted-foreground)]">1RM משוער</span>
        </div>
        <ul className="flex flex-col gap-2">
          {prs.map((p) => {
            const m = muscleById(p.muscle);
            return (
              <li key={p.name}>
                <GlassCard className="flex items-center gap-3 p-3">
                  <span className="size-2.5 rounded-full" style={{ background: m.color }} />
                  <div className="flex-1">
                    <p className="text-sm font-bold">{p.name}</p>
                    <p className="tnum text-xs text-[var(--color-muted-foreground)]">{fmtWeight(p.weight, unit)} {unitLabel(unit)} × {p.reps}</p>
                  </div>
                  <span className="tnum text-lg font-extrabold" style={{ color: m.color }}>{fmtWeight(p.e1, unit)}<span className="text-xs"> {unitLabel(unit)}</span></span>
                </GlassCard>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function AddWeightButton({ onAdd, unit }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState('');
  const [date, setDate] = useState(dayKey());
  const today = dayKey();

  if (!open) {
    return (
      <button onClick={() => { setVal(''); setDate(today); setOpen(true); }} className="press glass flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold">
        <Plus className="size-3.5 text-[var(--color-cyan)]" /> שקילה
      </button>
    );
  }
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (val) { vibrate(8); onAdd(toKg(val, unit), date); } setVal(''); setOpen(false); }}
      className="flex items-center gap-1.5"
    >
      <input
        type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)}
        className="tnum glass rounded-xl px-2 py-1.5 text-xs font-bold outline-none [color-scheme:dark]"
        aria-label="תאריך שקילה"
      />
      <input
        autoFocus type="number" inputMode="decimal" step="0.1" value={val} onChange={(e) => setVal(e.target.value)}
        placeholder={unitLabel(unit)} className="tnum glass w-14 rounded-xl px-2 py-1.5 text-center text-sm font-bold outline-none"
        aria-label={`משקל ב${unitLabel(unit)}`}
      />
      <button type="submit" className="btn-volt press rounded-xl px-2.5 py-1.5 text-xs font-bold">שמור</button>
    </form>
  );
}

function WeightHistory({ entries, onDelete, unit }) {
  const [open, setOpen] = useState(false);
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <div className="mt-3 border-t border-[var(--hairline)] pt-3">
      <button onClick={() => setOpen((o) => !o)} className="press text-xs font-semibold text-[var(--color-muted-foreground)]">
        {open ? 'הסתר היסטוריית שקילות' : `היסטוריית שקילות (${entries.length})`}
      </button>
      {open && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {sorted.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
              <span className="text-sm text-[var(--color-muted-foreground)]">{shortDateHe(b.date)}</span>
              <span className="tnum flex-1 text-end text-sm font-bold">{fmtWeight(b.weight, unit)} {unitLabel(unit)}</span>
              <button onClick={() => { vibrate(8); onDelete(b.id); }} className="press text-[var(--color-muted-foreground)]" aria-label="מחק שקילה">
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
