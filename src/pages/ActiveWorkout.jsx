import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Trash2, X, Flag, Timer, Dumbbell, Copy, Sparkles, StickyNote, CalendarDays } from 'lucide-react';
import { useStore } from '../store.jsx';
import { GlassCard, MuscleTag, EmptyState, WeightInput } from '../components/ui.jsx';
import ExercisePicker from '../components/ExercisePicker.jsx';
import RestTimer from '../components/RestTimer.jsx';
import WorkoutComplete from '../components/WorkoutComplete.jsx';
import { fmtDuration, workoutVolume, epley1rm, vibrate, unitLabel, fmtWeight, dayKey } from '../lib/utils.js';
import { useDialogFocus } from '../lib/useDialogFocus.js';

function workoutDisplayDuration(active) {
  if (!active) return 0;
  if (active.retroactive) return Math.max(60, Math.round(Number(active.durationSec) || 60));
  return Math.round((Date.now() - active.startedAt) / 1000);
}

export default function ActiveWorkout() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const active = state.active;
  const unit = state.profile.unit || 'kg';

  const [picker, setPicker] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [rest, setRest] = useState({ open: false, seconds: 90 });
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [completed, setCompleted] = useState(null);

  const bestByExercise = useMemo(() => {
    const best = {};
    for (const w of state.workouts) {
      for (const ex of w.exercises || []) {
        for (const s of ex.sets || []) {
          if (!s.done || !s.weight || !s.reps) continue;
          const e1 = epley1rm(s.weight, s.reps);
          if (e1 > (best[ex.exerciseId] || 0)) best[ex.exerciseId] = e1;
        }
      }
    }
    return best;
  }, [state.workouts]);

  useEffect(() => {
    if (!active) return undefined;
    if (active.retroactive) {
      setElapsed(workoutDisplayDuration(active));
      return undefined;
    }
    const t = setInterval(() => setElapsed(workoutDisplayDuration(active)), 1000);
    setElapsed(workoutDisplayDuration(active));
    return () => clearInterval(t);
  }, [active]);

  if (completed) {
    return (
      <WorkoutComplete
        open
        summary={completed}
        unit={unit}
        onDone={() => { setCompleted(null); navigate('/'); }}
      />
    );
  }

  if (!active) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="אין אימון פעיל"
        hint="התחל אימון חדש מהמסך הראשי או מתוכנית מוכנה."
        action={
          <button onClick={() => { dispatch({ type: 'startWorkout' }); }} className="btn-volt press rounded-2xl px-5 py-2.5 text-sm font-bold">
            התחל אימון חופשי
          </button>
        }
      />
    );
  }

  function toggleSet(exUid, set) {
    const next = !set.done;
    dispatch({ type: 'updateSet', uid: exUid, setId: set.id, patch: { done: next } });
    if (next) {
      vibrate(12);
      setRest((r) => ({ ...r, open: true }));
    }
  }

  function buildSummary() {
    const exs = active.exercises
      .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done && s.reps) }))
      .filter((e) => e.sets.length);

    const priorBest = {};
    for (const w of state.workouts) {
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          if (!s.done || !s.weight || !s.reps) continue;
          const e1 = epley1rm(s.weight, s.reps);
          if (e1 > (priorBest[ex.exerciseId] || 0)) priorBest[ex.exerciseId] = e1;
        }
      }
    }

    let totalSets = 0;
    let totalVolume = 0;
    const prs = [];
    for (const ex of exs) {
      totalSets += ex.sets.length;
      let bestE1 = 0;
      let bestSet = null;
      for (const s of ex.sets) {
        totalVolume += Number(s.reps) * Number(s.weight || 0);
        const e1 = epley1rm(s.weight, s.reps);
        if (e1 > bestE1) { bestE1 = e1; bestSet = s; }
      }
      if (bestE1 > 0 && bestE1 > (priorBest[ex.exerciseId] || 0)) {
        prs.push({ name: ex.name, weight: Number(bestSet.weight), reps: Number(bestSet.reps), e1: bestE1 });
      }
    }

    return {
      name: active.name,
      durationSec: workoutDisplayDuration(active),
      totalSets,
      totalVolume: Math.round(totalVolume),
      exerciseCount: exs.length,
      personalRecords: prs.sort((a, b) => b.e1 - a.e1),
    };
  }

  function finish() {
    const summary = buildSummary();
    setConfirmFinish(false);
    dispatch({ type: 'finishWorkout' });
    if (summary.exerciseCount === 0) {
      navigate('/');
      return;
    }
    vibrate([10, 40, 10, 40, 20]);
    setCompleted(summary);
  }

  const totalVolume = workoutVolume({ exercises: active.exercises });

  return (
    <div className="pb-4">
      {/* sticky session header */}
      <div className="solid shadow-[var(--shadow-overlay)] rounded-xl fade-up sticky top-2 z-30 mb-4 flex items-center justify-between gap-3 p-3">
        <button
          onClick={() => setConfirmFinish('discard')}
          className="press glass flex size-10 items-center justify-center rounded-xl"
          aria-label="בטל אימון"
        >
          <X className="size-4" />
        </button>
        <div className="text-center">
          <p className="text-xs font-medium text-[var(--color-muted-foreground)]">{active.name}</p>
          <p className="tnum flex items-center justify-center gap-1.5 text-xl font-extrabold">
            <Timer className="size-4 text-[var(--color-volt)]" />
            {fmtDuration(elapsed)}
          </p>
        </div>
        <button
          onClick={() => setConfirmFinish('finish')}
          className="btn-volt press flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-bold"
        >
          <Flag className="size-4" /> סיום
        </button>
      </div>

      {active.retroactive && <RetroWorkoutMeta active={active} dispatch={dispatch} />}

      {active.exercises.length === 0 ? (
        <EmptyState icon={Plus} title="הוסף את התרגיל הראשון" hint="בחר תרגיל מהספרייה כדי להתחיל לתעד סטים." />
      ) : (
        <ul className="flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {active.exercises.map((ex) => (
              <motion.li
                key={ex.uid}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              >
                <ExerciseCard ex={ex} unit={unit} priorBest={bestByExercise[ex.exerciseId] || 0} onToggle={toggleSet} dispatch={dispatch} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <button
        onClick={() => setPicker(true)}
        className="press glass mt-4 flex w-full items-center justify-center gap-2 rounded-[var(--r-lg)] py-3.5 text-sm font-bold"
      >
        <Plus className="size-4 text-[var(--color-volt)]" /> הוסף תרגיל
      </button>

      {active.exercises.length > 0 && (
        <p className="tnum mt-3 text-center text-xs text-[var(--color-muted-foreground)]">
          נפח נוכחי: {fmtWeight(totalVolume, unit).toLocaleString()} {unitLabel(unit)}
        </p>
      )}

      <ExercisePicker
        open={picker}
        onClose={() => setPicker(false)}
        onPick={(id) => { dispatch({ type: 'addExercise', exerciseId: id }); setPicker(false); }}
      />

      <RestTimer
        open={rest.open}
        seconds={rest.seconds}
        onChangeSeconds={(s) => setRest((r) => ({ ...r, seconds: s, open: true }))}
        onClose={() => setRest((r) => ({ ...r, open: false }))}
      />

      <ConfirmSheet
        mode={confirmFinish}
        onClose={() => setConfirmFinish(false)}
        onFinish={finish}
        onDiscard={() => { dispatch({ type: 'discardWorkout' }); navigate('/'); }}
      />
    </div>
  );
}

function RetroWorkoutMeta({ active, dispatch }) {
  const durationMin = Math.max(1, Math.round((Number(active.durationSec) || 60) / 60));

  return (
    <GlassCard className="mb-4 grid grid-cols-1 gap-3 p-3.5 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
        תאריך
        <span className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5">
          <CalendarDays className="size-4 text-[var(--color-cyan)]" />
          <input
            type="date"
            value={active.date}
            max={dayKey()}
            onChange={(e) => dispatch({ type: 'updateActiveMeta', date: e.target.value })}
            className="tnum min-w-0 flex-1 bg-transparent text-sm font-bold text-[var(--color-card-foreground)] outline-none [color-scheme:dark]"
            aria-label="תאריך אימון"
          />
        </span>
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
        משך בדקות
        <span className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5">
          <Timer className="size-4 text-[var(--color-volt)]" />
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={durationMin}
            onChange={(e) => dispatch({ type: 'updateActiveMeta', durationSec: Math.max(1, Number(e.target.value) || 1) * 60 })}
            className="tnum min-w-0 flex-1 bg-transparent text-sm font-bold text-[var(--color-card-foreground)] outline-none"
            aria-label="משך אימון בדקות"
          />
        </span>
      </label>
    </GlassCard>
  );
}

const setGridClass = 'grid grid-cols-1 gap-2 sm:grid-cols-[1.7rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_2.2rem] sm:items-center sm:gap-1.5';

function ExerciseCard({ ex, unit, priorBest, onToggle, dispatch }) {
  const doneCount = ex.sets.filter((s) => s.done).length;
  return (
    <GlassCard className="min-w-0 overflow-hidden flex flex-col gap-3 p-3.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2.5">
          <span className="font-bold">{ex.name}</span>
          <MuscleTag muscle={ex.muscle} />
        </div>
        <button
          onClick={() => dispatch({ type: 'removeExercise', uid: ex.uid })}
          className="press flex size-8 items-center justify-center self-end rounded-lg text-[var(--color-muted-foreground)] sm:self-auto"
          aria-label="הסר תרגיל"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className={`${setGridClass} hidden text-[11px] font-semibold text-[var(--color-muted-foreground)] sm:grid`}>
        <span className="text-center">סט</span>
        <span className="text-center">חזרות</span>
        <span className="text-center">משקל ({unitLabel(unit)})</span>
        <span className="text-center">RPE</span>
        <span className="text-center">{doneCount}/{ex.sets.length}</span>
      </div>

      {ex.sets.map((s, i) => (
        <div key={s.id} className={`${setGridClass} rounded-xl border border-[var(--hairline)] bg-white/[0.025] p-2.5 sm:border-0 sm:bg-transparent sm:p-0`}>
          <span className="flex items-center justify-between text-xs font-semibold text-[var(--color-muted-foreground)] sm:block sm:text-center">
            <span className="sm:hidden">סט</span>
            <span className="tnum text-sm font-bold">{i + 1}</span>
          </span>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-muted-foreground)] sm:block">
            <span className="sm:hidden">חזרות</span>
            <input
              type="number"
              inputMode="numeric"
              value={s.reps}
              onChange={(e) => dispatch({ type: 'updateSet', uid: ex.uid, setId: s.id, patch: { reps: e.target.value } })}
              placeholder="—"
              className="tnum min-w-0 rounded-xl bg-white/5 py-2.5 text-center text-base font-bold text-[var(--color-card-foreground)] outline-none focus:bg-white/10 sm:w-full"
              aria-label={`חזרות סט ${i + 1}`}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-muted-foreground)] sm:block">
            <span className="sm:hidden">משקל ({unitLabel(unit)})</span>
            <WeightInput
              kg={s.weight}
              unit={unit}
              onCommit={(kg) => dispatch({ type: 'updateSet', uid: ex.uid, setId: s.id, patch: { weight: kg } })}
              placeholder="—"
              className="tnum min-w-0 rounded-xl bg-white/5 py-2.5 text-center text-base font-bold text-[var(--color-card-foreground)] outline-none focus:bg-white/10 sm:w-full"
              aria-label={`משקל סט ${i + 1}`}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-muted-foreground)] sm:block">
            <span className="sm:hidden">RPE</span>
            <input
              type="number"
              inputMode="decimal"
              min="1"
              max="10"
              step="0.5"
              value={s.rpe || ''}
              onChange={(e) => dispatch({ type: 'updateSet', uid: ex.uid, setId: s.id, patch: { rpe: e.target.value } })}
              placeholder="—"
              className="tnum min-w-0 rounded-xl bg-white/5 py-2.5 text-center text-sm font-bold text-[var(--color-card-foreground)] outline-none focus:bg-white/10 sm:w-full"
              aria-label={`RPE סט ${i + 1}`}
            />
          </label>
          <button
            onClick={() => onToggle(ex.uid, s)}
            className="press relative flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-colors sm:size-9 sm:w-auto sm:justify-self-center sm:p-0"
            style={{
              background: s.done ? 'var(--color-volt)' : 'rgba(255,255,255,0.06)',
              color: s.done ? '#0a1500' : '#94a3b8',
            }}
            aria-label={s.done ? 'בטל סימון סט' : 'סמן סט כהושלם'}
            aria-pressed={s.done}
          >
            <Check className="size-4" strokeWidth={3} />
            <span className="sm:hidden">{s.done ? 'הושלם' : 'סמן כהושלם'}</span>
            {s.done && epley1rm(s.weight, s.reps) > priorBest && (
              <Sparkles className="absolute -end-1 -top-1 size-3.5 text-[var(--color-amber)]" />
            )}
          </button>
        </div>
      ))}

      <label className="flex items-start gap-2 rounded-xl bg-white/[0.035] px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
        <StickyNote className="mt-0.5 size-4 shrink-0" />
        <textarea
          value={ex.note || ''}
          onChange={(e) => dispatch({ type: 'updateExerciseNote', uid: ex.uid, note: e.target.value })}
          placeholder="הערה לתרגיל"
          rows={1}
          className="min-h-6 flex-1 resize-none bg-transparent text-sm font-semibold text-[var(--color-card-foreground)] outline-none placeholder:font-normal placeholder:text-[var(--color-muted-foreground)]"
        />
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={() => dispatch({ type: 'addSet', uid: ex.uid })}
          className="press flex-1 rounded-xl bg-white/5 py-2 text-xs font-bold text-[var(--color-muted-foreground)]"
        >
          + סט
        </button>
        <button
          onClick={() => dispatch({ type: 'duplicateSet', uid: ex.uid, setId: ex.sets.at(-1).id })}
          className="press flex items-center justify-center gap-1 rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-[var(--color-muted-foreground)]"
        >
          <Copy className="size-3.5" /> שכפל
        </button>
        {ex.sets.length > 1 && (
          <button
            onClick={() => dispatch({ type: 'removeSet', uid: ex.uid, setId: ex.sets.at(-1).id })}
            className="press rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-[var(--color-muted-foreground)]"
          >
            − סט
          </button>
        )}
      </div>
    </GlassCard>
  );
}

function ConfirmSheet({ mode, onClose, onFinish, onDiscard }) {
  const isFinish = mode === 'finish';
  const dialogRef = useDialogFocus(!!mode, onClose);
  return (
    <AnimatePresence>
      {mode && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            ref={dialogRef}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="solid shadow-[var(--shadow-overlay)] fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-2xl p-5 pb-[max(1.25rem,var(--safe-b))]"
            role="dialog" aria-modal="true"
          >
            <h3 className="mb-1 text-lg font-bold">{isFinish ? 'לסיים את האימון?' : 'לבטל את האימון?'}</h3>
            <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
              {isFinish ? 'הסטים שסומנו כהושלמו יישמרו בהיסטוריה.' : 'האימון הנוכחי יימחק ולא יישמר.'}
            </p>
            <div className="flex gap-2">
              <button onClick={onClose} className="press glass flex-1 rounded-2xl py-3 text-sm font-bold">חזרה</button>
              {isFinish ? (
                <button onClick={onFinish} className="btn-volt press flex-1 rounded-2xl py-3 text-sm font-bold">סיים ושמור</button>
              ) : (
                <button onClick={onDiscard} className="press flex-1 rounded-2xl bg-rose-500/90 py-3 text-sm font-bold text-white">
                  בטל אימון
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
