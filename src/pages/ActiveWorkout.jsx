import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Trash2, X, Flag, Timer, Dumbbell } from 'lucide-react';
import { useStore } from '../store.jsx';
import { GlassCard, MuscleTag, EmptyState } from '../components/ui.jsx';
import ExercisePicker from '../components/ExercisePicker.jsx';
import RestTimer from '../components/RestTimer.jsx';
import WorkoutComplete from '../components/WorkoutComplete.jsx';
import { fmtDuration, workoutVolume, epley1rm, vibrate } from '../lib/utils.js';

export default function ActiveWorkout() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const active = state.active;

  const [picker, setPicker] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [rest, setRest] = useState({ open: false, seconds: 90 });
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [completed, setCompleted] = useState(null);

  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(() => setElapsed(Math.round((Date.now() - active.startedAt) / 1000)), 1000);
    setElapsed(Math.round((Date.now() - active.startedAt) / 1000));
    return () => clearInterval(t);
  }, [active]);

  if (completed) {
    return (
      <WorkoutComplete
        open
        summary={completed}
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
      durationSec: Math.round((Date.now() - active.startedAt) / 1000),
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
                <ExerciseCard ex={ex} onToggle={toggleSet} dispatch={dispatch} />
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
          נפח נוכחי: {totalVolume.toLocaleString()} ק״ג
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

function ExerciseCard({ ex, onToggle, dispatch }) {
  const doneCount = ex.sets.filter((s) => s.done).length;
  return (
    <GlassCard className="flex flex-col gap-3 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="font-bold">{ex.name}</span>
          <MuscleTag muscle={ex.muscle} />
        </div>
        <button
          onClick={() => dispatch({ type: 'removeExercise', uid: ex.uid })}
          className="press flex size-8 items-center justify-center rounded-lg text-[var(--color-muted-foreground)]"
          aria-label="הסר תרגיל"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2 text-[11px] font-semibold text-[var(--color-muted-foreground)]">
        <span className="text-center">סט</span>
        <span className="text-center">חזרות</span>
        <span className="text-center">משקל (ק״ג)</span>
        <span className="text-center">{doneCount}/{ex.sets.length}</span>
      </div>

      {ex.sets.map((s, i) => (
        <div key={s.id} className="grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2">
          <span className="tnum text-center text-sm font-bold text-[var(--color-muted-foreground)]">{i + 1}</span>
          <input
            type="number"
            inputMode="numeric"
            value={s.reps}
            onChange={(e) => dispatch({ type: 'updateSet', uid: ex.uid, setId: s.id, patch: { reps: e.target.value } })}
            placeholder="—"
            className="tnum rounded-xl bg-white/5 py-2.5 text-center text-base font-bold outline-none focus:bg-white/10"
            aria-label={`חזרות סט ${i + 1}`}
          />
          <input
            type="number"
            inputMode="decimal"
            value={s.weight}
            onChange={(e) => dispatch({ type: 'updateSet', uid: ex.uid, setId: s.id, patch: { weight: e.target.value } })}
            placeholder="—"
            className="tnum rounded-xl bg-white/5 py-2.5 text-center text-base font-bold outline-none focus:bg-white/10"
            aria-label={`משקל סט ${i + 1}`}
          />
          <button
            onClick={() => onToggle(ex.uid, s)}
            className="press flex size-9 items-center justify-center justify-self-center rounded-xl transition-colors"
            style={{
              background: s.done ? 'var(--color-volt)' : 'rgba(255,255,255,0.06)',
              color: s.done ? '#0a1500' : '#94a3b8',
            }}
            aria-label={s.done ? 'בטל סימון סט' : 'סמן סט כהושלם'}
            aria-pressed={s.done}
          >
            <Check className="size-4" strokeWidth={3} />
          </button>
        </div>
      ))}

      <div className="flex gap-2">
        <button
          onClick={() => dispatch({ type: 'addSet', uid: ex.uid })}
          className="press flex-1 rounded-xl bg-white/5 py-2 text-xs font-bold text-[var(--color-muted-foreground)]"
        >
          + סט
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
  return (
    <AnimatePresence>
      {mode && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
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
