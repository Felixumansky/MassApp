import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Plus, Zap } from 'lucide-react';
import { MuscleTag } from './ui.jsx';
import { resolveExercise, routineExerciseId } from '../lib/exercises.js';
import { useDialogFocus } from '../lib/useDialogFocus.js';

/**
 * Bottom sheet for choosing a workout type when starting a new workout.
 * `onPick(routine | null)` — null means a free workout.
 */
export default function StartWorkoutSheet({ open, onClose, routines, workouts, customExercises, onPick, onCreateRoutine }) {
  return (
    <AnimatePresence>
      {open && (
        <SheetInner
          onClose={onClose}
          routines={routines}
          workouts={workouts}
          customExercises={customExercises}
          onPick={onPick}
          onCreateRoutine={onCreateRoutine}
        />
      )}
    </AnimatePresence>
  );
}

/** Same matching as the reducer: routineId first, then a duplicated routine's
    source, then name fallback for old history. */
function lastWorkoutOfType(workouts, routine) {
  return (
    workouts.find((w) => w.routineId === routine.id) ||
    (routine.sourceId && workouts.find((w) => w.routineId === routine.sourceId)) ||
    workouts.find((w) => !w.routineId && w.name === routine.name) ||
    null
  );
}

function fmtDate(dateKey) {
  const [, m, d] = dateKey.split('-');
  return `${Number(d)}.${Number(m)}`;
}

function SheetInner({ onClose, routines, workouts, customExercises, onPick, onCreateRoutine }) {
  const dialogRef = useDialogFocus(true, onClose);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        ref={dialogRef}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="solid shadow-[var(--shadow-overlay)] fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] max-w-md flex-col rounded-t-2xl p-4 pb-[max(1rem,var(--safe-b))]"
        role="dialog" aria-modal="true" aria-label="בחירת סוג אימון"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">איזה אימון היום?</h2>
          <button onClick={onClose} className="press glass flex size-9 items-center justify-center rounded-xl" aria-label="סגור">
            <X className="size-4" />
          </button>
        </div>

        <div className="-mx-1 flex flex-1 flex-col gap-2 overflow-y-auto px-1">
          {routines.map((r) => {
            const muscles = [...new Set(r.exercises.map((entry) => resolveExercise(routineExerciseId(entry), customExercises)?.muscle).filter(Boolean))].slice(0, 4);
            const prev = lastWorkoutOfType(workouts, r);
            return (
              <button key={r.id} onClick={() => onPick(r)} className="press glass rounded-2xl p-3.5 text-start">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold">{r.name || 'תוכנית ללא שם'}</p>
                  <Play className="size-4 shrink-0 text-[var(--color-volt)]" fill="currentColor" />
                </div>
                <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                  {r.exercises.length} תרגילים ·{' '}
                  {prev ? `בפעם האחרונה: ${fmtDate(prev.date)} — המשקלים ימולאו אוטומטית` : 'אימון ראשון מסוגו'}
                </p>
                {muscles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {muscles.map((m) => <MuscleTag key={m} muscle={m} />)}
                  </div>
                )}
              </button>
            );
          })}

          <button onClick={() => onPick(null)} className="press glass flex items-center gap-2 rounded-2xl p-3.5 text-start">
            <Zap className="size-4 shrink-0 text-[var(--color-muted-foreground)]" />
            <div>
              <p className="font-bold">אימון חופשי</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">התחל ריק והוסף תרגילים תוך כדי</p>
            </div>
          </button>
        </div>

        <button
          onClick={onCreateRoutine}
          className="press mt-3 flex shrink-0 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-sm font-bold text-[var(--color-muted-foreground)]"
        >
          <Plus className="size-4" /> צור סוג אימון חדש
        </button>
      </motion.div>
    </>
  );
}
