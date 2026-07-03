import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Pencil, Trash2, X, Dumbbell } from 'lucide-react';
import { useStore } from '../store.jsx';
import { GlassCard, MuscleTag } from './ui.jsx';
import {
  workoutVolume,
  workoutSetCount,
  fmtDuration,
  dayKey,
  formatDateHe,
  fmtWeightBoth,
  vibrate,
} from '../lib/utils.js';
import { useDialogFocus } from '../lib/useDialogFocus.js';

export default function WorkoutHistoryList({ workouts, unit }) {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(null);

  function deleteWorkout(workout) {
    if (!confirm(`למחוק את "${workout.name || 'אימון'}"?`)) return;
    vibrate(8);
    dispatch({ type: 'deleteWorkout', id: workout.id });
  }

  function editFull(workout) {
    if (state.active) {
      alert('יש אימון פעיל. סיים או בטל אותו לפני עריכה מלאה של אימון מההיסטוריה.');
      return;
    }
    vibrate(8);
    dispatch({ type: 'editWorkout', id: workout.id });
    setEditing(null);
    navigate('/workout');
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {workouts.map((w, i) => (
          <li key={w.id} className="fade-up" style={{ '--d': `${0.06 * i}s` }}>
            <WorkoutRow
              workout={w}
              unit={unit}
              onEdit={() => setEditing(w)}
              onDelete={() => deleteWorkout(w)}
            />
          </li>
        ))}
      </ul>

      <WorkoutEditor
        workout={editing}
        onClose={() => setEditing(null)}
        onEditFull={editFull}
        onSave={(id, patch) => {
          dispatch({ type: 'updateWorkout', id, patch });
          setEditing(null);
        }}
      />
    </>
  );
}

function WorkoutRow({ workout: w, unit, onEdit, onDelete }) {
  const muscles = [...new Set((w.exercises || []).map((e) => e.muscle))].slice(0, 3);
  return (
    <GlassCard className="flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-bold">{w.name || 'אימון'}</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">{formatDateHe(w.date)}</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="tnum ms-1 flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-[var(--color-muted-foreground)]">
            <Clock className="size-3.5" /> {fmtDuration(w.durationSec)}
          </span>
          <button
            onClick={onEdit}
            className="press flex size-8 items-center justify-center rounded-lg text-[var(--color-muted-foreground)]"
            aria-label="ערוך אימון"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={onDelete}
            className="press flex size-8 items-center justify-center rounded-lg text-[var(--color-muted-foreground)]"
            aria-label="מחק אימון"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      {muscles.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {muscles.map((m) => (
            <MuscleTag key={m} muscle={m} />
          ))}
        </div>
      )}
      <div className="tnum flex gap-4 text-xs text-[var(--color-muted-foreground)]">
        <span>{workoutSetCount(w)} סטים</span>
        <span>{fmtWeightBoth(workoutVolume(w), unit)} נפח</span>
      </div>
    </GlassCard>
  );
}

function WorkoutEditor({ workout, onClose, onSave, onEditFull }) {
  if (!workout) return null;
  return <WorkoutEditorInner key={workout.id} workout={workout} onClose={onClose} onSave={onSave} onEditFull={onEditFull} />;
}

function WorkoutEditorInner({ workout, onClose, onSave, onEditFull }) {
  const [name, setName] = useState(workout.name || '');
  const [date, setDate] = useState(workout.date || dayKey());
  const [durationMin, setDurationMin] = useState(Math.max(1, Math.round((Number(workout.durationSec) || 60) / 60)));
  const dialogRef = useDialogFocus(true, onClose);

  function submit(e) {
    e.preventDefault();
    const minutes = Math.max(1, Math.round(Number(durationMin) || 1));
    vibrate(8);
    onSave(workout.id, {
      name: name.trim() || 'אימון',
      date,
      durationSec: minutes * 60,
    });
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />
      <motion.form
        ref={dialogRef}
        onSubmit={submit}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="solid shadow-[var(--shadow-overlay)] fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md flex-col gap-3 rounded-t-2xl p-5 pb-[max(1.25rem,var(--safe-b))]"
        role="dialog" aria-modal="true" aria-label="עריכת אימון"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">עריכת אימון</h2>
          <button type="button" onClick={onClose} className="press glass flex size-9 items-center justify-center rounded-xl" aria-label="סגור">
            <X className="size-4" />
          </button>
        </div>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
          שם אימון
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם האימון"
            className="glass rounded-2xl px-4 py-3 text-sm font-bold text-[var(--color-card-foreground)] outline-none placeholder:font-normal placeholder:text-[var(--color-muted-foreground)]"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
          תאריך
          <input
            type="date"
            value={date}
            max={dayKey()}
            onChange={(e) => setDate(e.target.value)}
            className="tnum glass rounded-2xl px-4 py-3 text-sm font-bold text-[var(--color-card-foreground)] outline-none [color-scheme:dark]"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
          משך בדקות
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            className="tnum glass rounded-2xl px-4 py-3 text-sm font-bold text-[var(--color-card-foreground)] outline-none"
            required
          />
        </label>

        <button
          type="button"
          onClick={() => onEditFull(workout)}
          className="press glass flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold"
        >
          <Dumbbell className="size-4 text-[var(--color-volt)]" /> עריכה מלאה — תרגילים וסטים
        </button>

        <button type="submit" className="btn-volt press mt-1 rounded-2xl py-3.5 text-sm font-bold">
          שמור שינויים
        </button>
      </motion.form>
    </>
  );
}
