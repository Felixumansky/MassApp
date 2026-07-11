import { lazy, Suspense, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Dumbbell, Layers, Scale, ChevronLeft, Activity } from 'lucide-react';
import { useStore } from '../store.jsx';
import { PageHeader, GlassCard, EmptyState, AppLoader } from '../components/ui.jsx';
import WorkoutHistoryList from '../components/WorkoutHistory.jsx';
import { workoutVolume, epley1rm, shortDateHe, dayKey, toUnit, fmtWeight, fmtWeightBoth, unitLabel, otherUnit } from '../lib/utils.js';
import { MUSCLES, muscleById } from '../lib/exercises.js';
import { setsByMuscle, muscleSetStatus, HYPERTROPHY_MIN, HYPERTROPHY_MAX } from '../lib/analytics.js';

const VolumeChart = lazy(() => import('../components/ProgressCharts.jsx').then((m) => ({ default: m.VolumeChart })));

export default function Progress() {
  const { state } = useStore();
  const navigate = useNavigate();
  const { workouts, bodyWeights, profile } = state;
  const unit = profile.unit || 'kg';
  const [volExId, setVolExId] = useState('all');
  const [muscleRange, setMuscleRange] = useState('week');

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
      buckets.push({ label: shortDateHe(endKey), volume: Math.round(toUnit(vol, unit)), kg: vol });
    }
    return buckets;
  }, [workouts, volExId, unit]);

  const latestWeight = bodyWeights.at(-1);

  // Feature 1 — working sets per muscle group, this week or a 4‑week average.
  const muscleBalance = useMemo(() => {
    const weeks = muscleRange === 'avg4' ? 4 : 1;
    const startKey = dayKey(new Date(Date.now() - (weeks * 7 - 1) * 864e5));
    const raw = setsByMuscle(workouts, startKey, dayKey());
    const maxSets = Math.max(HYPERTROPHY_MAX, ...Object.values(raw).map((n) => n / weeks));
    return MUSCLES.map((m) => {
      const sets = Math.round((raw[m.id] / weeks) * 10) / 10;
      return { ...m, sets, status: muscleSetStatus(sets), pct: Math.min(100, (sets / maxSets) * 100), minPct: (HYPERTROPHY_MIN / maxSets) * 100, maxPct: (HYPERTROPHY_MAX / maxSets) * 100 };
    });
  }, [workouts, muscleRange]);

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

  const weightLink = (
    <button onClick={() => navigate('/weight')} className="press w-full text-start">
      <GlassCard className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl" style={{ background: 'rgba(94,194,245,0.14)' }}>
          <Scale className="size-5" style={{ color: 'var(--color-cyan)' }} />
        </span>
        <div className="flex-1">
          <p className="font-bold">משקל גוף</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {latestWeight ? `עודכן לאחרונה ${shortDateHe(latestWeight.date)}` : 'הוסף שקילה ראשונה'}
          </p>
        </div>
        {latestWeight && (
          <span className="flex flex-col items-end">
            <span className="tnum text-lg font-extrabold leading-tight" style={{ color: 'var(--color-cyan)' }}>
              {fmtWeight(latestWeight.weight, 'kg')}<span className="text-xs text-[var(--color-muted-foreground)]"> ק״ג</span>
            </span>
            <span className="tnum text-[10px] font-semibold text-[var(--color-muted-foreground)]">{fmtWeight(latestWeight.weight, 'lb')} lb</span>
          </span>
        )}
        <ChevronLeft className="size-5 text-[var(--color-muted-foreground)]" />
      </GlassCard>
    </button>
  );

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader subtitle="נתונים" title="התקדמות" />
        <EmptyState icon={Trophy} title="אין נתונים עדיין" hint="השלם אימון אחד לפחות כדי לראות גרפים ושיאים." />
        {weightLink}
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
            <p className="tnum text-2xl font-extrabold leading-none">{(toUnit(totals.volume, unit) / 1000).toFixed(1)}<span className="text-sm">{unit === 'lb' ? 'K lb' : 'ט׳'}</span></p>
            <p className="tnum text-[10px] font-semibold text-[var(--color-muted-foreground)]">
              {(toUnit(totals.volume, otherUnit(unit)) / 1000).toFixed(1)} {otherUnit(unit) === 'lb' ? 'K lb' : 'ט׳'}
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">נפח כולל</p>
          </div>
        </GlassCard>
      </section>

      <section>
        <h2 className="mb-2 font-bold">היסטוריית אימונים</h2>
        <WorkoutHistoryList workouts={workouts} unit={unit} />
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

      <MuscleBalanceCard data={muscleBalance} range={muscleRange} onRange={setMuscleRange} />

      {weightLink}

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
                    <p className="tnum text-xs text-[var(--color-muted-foreground)]">{fmtWeightBoth(p.weight, unit)} × {p.reps}</p>
                  </div>
                  <span className="flex flex-col items-end">
                    <span className="tnum text-lg font-extrabold leading-tight" style={{ color: m.color }}>{fmtWeight(p.e1, unit)}<span className="text-xs"> {unitLabel(unit)}</span></span>
                    <span className="tnum text-[10px] font-semibold text-[var(--color-muted-foreground)]">{fmtWeight(p.e1, otherUnit(unit))} {unitLabel(otherUnit(unit))}</span>
                  </span>
                </GlassCard>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

const STATUS_META = {
  low: { label: 'נמוך', color: '#94a3b8' },
  optimal: { label: 'מיטבי', color: 'var(--color-volt)' },
  high: { label: 'גבוה', color: '#fb923c' },
};

function MuscleBalanceCard({ data, range, onRange }) {
  const anySets = data.some((m) => m.sets > 0);
  return (
    <GlassCard>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="mb-1 flex items-center gap-1.5 font-bold">
            <Activity className="size-4 text-[var(--color-volt)]" /> מאזן שרירים
          </h2>
          <p className="text-xs text-[var(--color-muted-foreground)]">סטים לקבוצת שריר · יעד היפרטרופיה {HYPERTROPHY_MIN}–{HYPERTROPHY_MAX}</p>
        </div>
        <select
          value={range}
          onChange={(e) => onRange(e.target.value)}
          className="glass shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none [color-scheme:dark]"
          style={{ color: 'var(--color-foreground)' }}
          aria-label="בחירת טווח למאזן שרירים"
        >
          <option value="week" style={{ background: '#15181d', color: '#e7ecf1' }}>השבוע</option>
          <option value="avg4" style={{ background: '#15181d', color: '#e7ecf1' }}>ממוצע 4 שבועות</option>
        </select>
      </div>

      {!anySets ? (
        <p className="py-6 text-center text-sm text-[var(--color-muted-foreground)]">אין סטים בטווח הנבחר</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {data.map((m) => {
            const st = STATUS_META[m.status];
            return (
              <li key={m.id} className="flex items-center gap-2.5">
                <span className="w-16 shrink-0 text-xs font-semibold" style={{ color: m.color }}>{m.label}</span>
                <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                  {/* hypertrophy target band 10–20 */}
                  <span
                    className="absolute inset-y-0 rounded-full bg-white/[0.06]"
                    style={{ insetInlineStart: `${m.minPct}%`, width: `${Math.max(0, m.maxPct - m.minPct)}%` }}
                  />
                  <span
                    className="absolute inset-y-0 rounded-full"
                    style={{ insetInlineStart: 0, width: `${m.pct}%`, background: m.color, opacity: m.status === 'low' ? 0.45 : 0.9 }}
                  />
                </div>
                <span className="tnum w-8 shrink-0 text-end text-sm font-bold">{m.sets}</span>
                <span className="w-10 shrink-0 text-end text-[10px] font-bold" style={{ color: st.color }}>{st.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}

