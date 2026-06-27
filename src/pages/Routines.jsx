import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Pencil, Trash2, X, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { useStore } from '../store.jsx';
import { PageHeader, GlassCard, MuscleTag, EmptyState } from '../components/ui.jsx';
import ExercisePicker from '../components/ExercisePicker.jsx';
import { resolveExercise, routineExerciseId, routineExerciseTargets } from '../lib/exercises.js';
import { uid, vibrate } from '../lib/utils.js';
import { useDialogFocus } from '../lib/useDialogFocus.js';

export default function Routines() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(null); // routine draft or null

  function startRoutine(routine) {
    vibrate(10);
    dispatch({ type: 'startWorkout', routine });
    navigate('/workout');
  }

  function deleteRoutine(routine) {
    if (!confirm(`למחוק את "${routine.name || 'תוכנית ללא שם'}"?`)) return;
    dispatch({ type: 'deleteRoutine', id: routine.id });
  }

  return (
    <div>
      <PageHeader
        subtitle="תבניות אימון"
        title="תוכניות"
        action={
          <button
            onClick={() => setEditing({ id: uid(), name: '', exercises: [] })}
            className="btn-volt press flex items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-sm font-bold"
          >
            <Plus className="size-4" /> חדשה
          </button>
        }
      />

      {state.routines.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="אין תוכניות עדיין"
          hint="צור תבנית אימון (למשל Push / Pull / Legs) כדי להתחיל אימון בלחיצה אחת."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {state.routines.map((r, i) => {
            const muscles = [...new Set(r.exercises.map((entry) => resolveExercise(routineExerciseId(entry), state.customExercises)?.muscle).filter(Boolean))].slice(0, 4);
            return (
              <li key={r.id} className="fade-up" style={{ '--d': `${0.05 * i}s` }}>
                <GlassCard className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{r.name || 'תוכנית ללא שם'}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">{r.exercises.length} תרגילים</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditing({ ...r })} className="press flex size-8 items-center justify-center rounded-lg text-[var(--color-muted-foreground)]" aria-label="ערוך">
                        <Pencil className="size-4" />
                      </button>
                      <button onClick={() => deleteRoutine(r)} className="press flex size-8 items-center justify-center rounded-lg text-[var(--color-muted-foreground)]" aria-label="מחק">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {muscles.map((m) => <MuscleTag key={m} muscle={m} />)}
                  </div>
                  <button onClick={() => startRoutine(r)} className="btn-volt press flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-bold">
                    <Play className="size-4" fill="currentColor" /> התחל אימון
                  </button>
                </GlassCard>
              </li>
            );
          })}
        </ul>
      )}

      <RoutineEditor
        draft={editing}
        onClose={() => setEditing(null)}
        onSave={(routine) => { dispatch({ type: 'saveRoutine', routine }); setEditing(null); }}
      />
    </div>
  );
}

function RoutineEditor({ draft, onClose, onSave }) {
  const [picker, setPicker] = useState(false);
  if (!draft) return null;
  return <RoutineEditorInner key={draft.id} draft={draft} picker={picker} setPicker={setPicker} onClose={onClose} onSave={onSave} />;
}

function RoutineEditorInner({ draft, picker, setPicker, onClose, onSave }) {
  const { state } = useStore();
  const [name, setName] = useState(draft.name);
  const [exercises, setExercises] = useState(draft.exercises);
  const dialogRef = useDialogFocus(true, onClose);

  function updateEntry(idx, patch) {
    setExercises((xs) =>
      xs.map((entry, i) =>
        i === idx
          ? {
              exerciseId: routineExerciseId(entry),
              ...routineExerciseTargets(entry),
              ...patch,
            }
          : entry
      )
    );
  }

  function moveEntry(idx, dir) {
    setExercises((xs) => {
      const next = [...xs];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return xs;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <motion.div
        ref={dialogRef}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="solid shadow-[var(--shadow-overlay)] fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] max-w-md flex-col rounded-t-2xl p-4 pb-[max(1rem,var(--safe-b))]"
        role="dialog" aria-modal="true" aria-label="עריכת תוכנית"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{draft.name ? 'עריכת תוכנית' : 'תוכנית חדשה'}</h2>
          <button onClick={onClose} className="press glass flex size-9 items-center justify-center rounded-xl" aria-label="סגור">
            <X className="size-4" />
          </button>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="שם התוכנית (למשל: Push)"
          className="glass mb-3 w-full rounded-2xl px-4 py-3 text-sm font-semibold outline-none placeholder:font-normal placeholder:text-[var(--color-muted-foreground)]"
        />

        <div className="-mx-1 flex-1 overflow-y-auto px-1">
          {exercises.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">הוסף תרגילים לתוכנית</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {exercises.map((id, idx) => {
                const exerciseId = routineExerciseId(id);
                const targets = routineExerciseTargets(id);
                const ex = resolveExercise(exerciseId, state.customExercises);
                return (
                  <li key={`${exerciseId}-${idx}`} className="glass flex flex-col gap-2 rounded-2xl px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <GripVertical className="size-4 text-[var(--color-muted-foreground)]" />
                      <span className="flex-1 text-sm font-semibold">{ex?.name ?? exerciseId}</span>
                      <MuscleTag muscle={ex?.muscle} />
                      <button onClick={() => moveEntry(idx, -1)} disabled={idx === 0} className="press text-[var(--color-muted-foreground)] disabled:opacity-30" aria-label="הזז למעלה">
                        <ArrowUp className="size-4" />
                      </button>
                      <button onClick={() => moveEntry(idx, 1)} disabled={idx === exercises.length - 1} className="press text-[var(--color-muted-foreground)] disabled:opacity-30" aria-label="הזז למטה">
                        <ArrowDown className="size-4" />
                      </button>
                      <button onClick={() => setExercises((xs) => xs.filter((_, i) => i !== idx))} className="press text-[var(--color-muted-foreground)]" aria-label="הסר">
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-2 py-1.5 text-xs text-[var(--color-muted-foreground)]">
                        סטים
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={targets.targetSets}
                          onChange={(e) => updateEntry(idx, { targetSets: e.target.value })}
                          className="tnum min-w-0 flex-1 bg-transparent text-end font-bold text-[var(--color-card-foreground)] outline-none"
                        />
                      </label>
                      <label className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-2 py-1.5 text-xs text-[var(--color-muted-foreground)]">
                        חזרות
                        <input
                          type="text"
                          inputMode="numeric"
                          value={targets.targetReps}
                          onChange={(e) => updateEntry(idx, { targetReps: e.target.value })}
                          placeholder="ריק"
                          className="tnum min-w-0 flex-1 bg-transparent text-end font-bold text-[var(--color-card-foreground)] outline-none placeholder:text-[var(--color-muted-foreground)]"
                        />
                      </label>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <button onClick={() => setPicker(true)} className="press glass my-3 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold">
          <Plus className="size-4 text-[var(--color-volt)]" /> הוסף תרגיל
        </button>

        <button
          onClick={() => onSave({ id: draft.id, name: name.trim() || 'תוכנית', exercises })}
          disabled={exercises.length === 0}
          className="btn-volt press rounded-2xl py-3.5 text-sm font-bold disabled:opacity-40"
        >
          שמור תוכנית
        </button>

        <ExercisePicker
          open={picker}
          onClose={() => setPicker(false)}
          onPick={(id) => { setExercises((xs) => [...xs, { exerciseId: id, targetSets: 3, targetReps: '' }]); setPicker(false); }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
