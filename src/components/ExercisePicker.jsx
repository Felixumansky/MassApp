import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { EXERCISES, MUSCLES, muscleById } from '../lib/exercises.js';
import { vibrate } from '../lib/utils.js';
import { useStore } from '../store.jsx';
import { useDialogFocus } from '../lib/useDialogFocus.js';

/** Bottom-sheet exercise picker with search + muscle filter. */
export default function ExercisePicker({ open, onClose, onPick, excludeIds = [] }) {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState('all');
  const dialogRef = useDialogFocus(open, onClose);

  const results = useMemo(() => {
    const needle = q.trim();
    const all = [...EXERCISES, ...(state.customExercises || [])];
    return all.filter((e) => {
      if (muscle !== 'all' && e.muscle !== muscle) return false;
      if (needle && !e.name.includes(needle)) return false;
      return true;
    });
  }, [q, muscle, state.customExercises]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            ref={dialogRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="solid shadow-[var(--shadow-overlay)] fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[82dvh] max-w-md flex-col rounded-t-2xl p-4 pb-[max(1rem,var(--safe-b))]"
            role="dialog"
            aria-modal="true"
            aria-label="בחירת תרגיל"
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/15" />

            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">הוספת תרגיל</h2>
              <button onClick={onClose} className="press glass flex size-9 items-center justify-center rounded-xl" aria-label="סגור">
                <X className="size-4" />
              </button>
            </div>

            <label className="glass mb-3 flex items-center gap-2 rounded-2xl px-3 py-2.5">
              <Search className="size-4 text-[var(--color-muted-foreground)]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="חיפוש תרגיל…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-muted-foreground)]"
              />
            </label>

            <div className="-mx-1 mb-2 flex gap-2 overflow-x-auto px-1 pb-1">
              <Chip active={muscle === 'all'} onClick={() => setMuscle('all')} label="הכל" />
              {MUSCLES.map((m) => (
                <Chip key={m.id} active={muscle === m.id} onClick={() => setMuscle(m.id)} label={m.label} color={m.color} />
              ))}
            </div>

            <div className="-mx-1 flex-1 overflow-y-auto px-1">
              {results.map((e) => {
                const used = excludeIds.includes(e.id);
                const m = muscleById(e.muscle);
                return (
                  <button
                    key={e.id}
                    disabled={used}
                    onClick={() => { vibrate(8); onPick(e.id); }}
                    className="press mb-1.5 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-start disabled:opacity-40"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <span className="size-2.5 rounded-full" style={{ background: m.color }} />
                    <span className="flex-1 font-semibold">{e.name}</span>
                    <span className="text-xs text-[var(--color-muted-foreground)]">{m.label}</span>
                  </button>
                );
              })}
              {results.length === 0 && (
                <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">לא נמצאו תרגילים</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Chip({ active, onClick, label, color = '#c6f24e' }) {
  return (
    <button
      onClick={onClick}
      className="press shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold"
      style={{
        background: active ? `${color}24` : 'rgba(255,255,255,0.05)',
        color: active ? color : '#94a3b8',
      }}
    >
      {label}
    </button>
  );
}
