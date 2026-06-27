import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';
import { Trophy, Dumbbell, Layers, Plus } from 'lucide-react';
import { useStore } from '../store.jsx';
import { PageHeader, GlassCard, EmptyState } from '../components/ui.jsx';
import { workoutVolume, epley1rm, shortDateHe, dayKey, vibrate } from '../lib/utils.js';
import { muscleById } from '../lib/exercises.js';

export default function Progress() {
  const { state, dispatch } = useStore();
  const { workouts, bodyWeights } = state;

  const weekly = useMemo(() => {
    const buckets = [];
    for (let i = 7; i >= 0; i--) {
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const startKey = dayKey(new Date(end.getTime() - 6 * 864e5));
      const endKey = dayKey(end);
      const vol = workouts
        .filter((w) => w.date >= startKey && w.date <= endKey)
        .reduce((s, w) => s + workoutVolume(w), 0);
      buckets.push({ label: shortDateHe(endKey), volume: vol });
    }
    return buckets;
  }, [workouts]);

  const weights = useMemo(
    () => bodyWeights.map((b) => ({ label: shortDateHe(b.date), weight: b.weight })),
    [bodyWeights]
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
            <p className="tnum text-2xl font-extrabold leading-none">{(totals.volume / 1000).toFixed(1)}<span className="text-sm">ט׳</span></p>
            <p className="text-xs text-[var(--color-muted-foreground)]">נפח כולל</p>
          </div>
        </GlassCard>
      </section>

      <GlassCard>
        <h2 className="mb-1 font-bold">נפח שבועי</h2>
        <p className="mb-3 text-xs text-[var(--color-muted-foreground)]">ק״ג מורמים ב‑8 השבועות האחרונים</p>
        <div className="chart-frame h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<VolTip />} />
              <Bar dataKey="volume" radius={[6, 6, 0, 0]} maxBarSize={26}>
                {weekly.map((d, i) => (
                  <Cell key={i} fill={i === weekly.length - 1 ? 'var(--color-volt)' : 'rgba(198,242,78,0.32)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-bold">משקל גוף</h2>
            <p className="text-xs text-[var(--color-muted-foreground)]">מגמה לאורך זמן</p>
          </div>
          <AddWeightButton onAdd={(weight) => dispatch({ type: 'addBodyWeight', weight })} />
        </div>
        {weights.length > 0 ? (
          <div className="chart-frame h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weights} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
                <Tooltip content={<WeightTip />} />
                <Area type="monotone" dataKey="weight" stroke="var(--color-cyan)" strokeWidth={2.5} fill="url(#wg)" dot={{ r: 3, fill: 'var(--color-cyan)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-[var(--color-muted-foreground)]">הוסף שקילה ראשונה</p>
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
                    <p className="tnum text-xs text-[var(--color-muted-foreground)]">{p.weight} ק״ג × {p.reps}</p>
                  </div>
                  <span className="tnum text-lg font-extrabold" style={{ color: m.color }}>{p.e1}<span className="text-xs"> ק״ג</span></span>
                </GlassCard>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function AddWeightButton({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState('');
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="press glass flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold">
        <Plus className="size-3.5 text-[var(--color-cyan)]" /> שקילה
      </button>
    );
  }
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (val) { vibrate(8); onAdd(val); } setVal(''); setOpen(false); }}
      className="flex items-center gap-1.5"
    >
      <input
        autoFocus type="number" inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)}
        placeholder="ק״ג" className="tnum glass w-16 rounded-xl px-2 py-1.5 text-center text-sm font-bold outline-none"
      />
      <button type="submit" className="btn-volt press rounded-xl px-2.5 py-1.5 text-xs font-bold">שמור</button>
    </form>
  );
}

function VolTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass glass-strong rounded-xl px-3 py-2 text-xs">
      <p className="tnum font-bold">{payload[0].value.toLocaleString()} ק״ג</p>
    </div>
  );
}
function WeightTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass glass-strong rounded-xl px-3 py-2 text-xs">
      <p className="tnum font-bold">{payload[0].value} ק״ג</p>
    </div>
  );
}
