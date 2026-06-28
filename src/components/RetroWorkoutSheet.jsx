import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { dayKey } from '../lib/utils.js';
import { useDialogFocus } from '../lib/useDialogFocus.js';

/**
 * Bottom sheet for logging a past ("retroactive") workout. Controlled via
 * `open`/`onClose`; calls `onStart({ retroactive, date, durationSec, routine })`
 * on submit. `initialDate` pre-fills the date field (defaults to today).
 */
export default function RetroWorkoutSheet({ open, onClose, onStart, routines, initialDate }) {
  return (
    <AnimatePresence>
      {open && (
        <RetroSheetInner
          key={initialDate || 'today'}
          onClose={onClose}
          onStart={onStart}
          routines={routines}
          initialDate={initialDate}
        />
      )}
    </AnimatePresence>
  );
}

function RetroSheetInner({ onClose, onStart, routines, initialDate }) {
  const today = dayKey();
  const [date, setDate] = useState(initialDate || today);
  const [durationMin, setDurationMin] = useState(60);
  const [routineId, setRoutineId] = useState('free');
  const dialogRef = useDialogFocus(true, onClose);

  function submit(e) {
    e.preventDefault();
    const minutes = Math.max(1, Math.round(Number(durationMin) || 1));
    const routine = routines.find((r) => r.id === routineId);
    onStart({ retroactive: true, date, durationSec: minutes * 60, routine });
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4 pb-[max(1rem,var(--safe-b))] pt-[max(1rem,var(--safe-t))]">
        <motion.form
          ref={dialogRef}
          onSubmit={submit}
          initial={{ y: 24, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          className="solid pointer-events-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-2xl p-5 shadow-[var(--shadow-overlay)]"
          role="dialog" aria-modal="true" aria-label="רישום אימון קודם"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">רישום אימון קודם</h2>
            <button type="button" onClick={onClose} className="press glass flex size-9 items-center justify-center rounded-xl" aria-label="סגור">
              <X className="size-4" />
            </button>
          </div>

          <div className="-mx-1 mt-3 flex flex-1 flex-col gap-3 overflow-y-auto px-1">
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
              תאריך
              <input
                type="date"
                value={date}
                max={today}
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

            <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
              אימון
              <select
                value={routineId}
                onChange={(e) => setRoutineId(e.target.value)}
                className="glass rounded-2xl px-4 py-3 text-sm font-bold text-[var(--color-card-foreground)] outline-none [color-scheme:dark]"
              >
                <option value="free" style={{ background: '#15181d', color: '#e7ecf1' }}>אימון חופשי</option>
                {routines.map((r) => (
                  <option key={r.id} value={r.id} style={{ background: '#15181d', color: '#e7ecf1' }}>{r.name || 'תוכנית ללא שם'}</option>
                ))}
              </select>
            </label>
          </div>

          <button type="submit" className="btn-volt press mt-3 shrink-0 rounded-2xl py-3.5 text-sm font-bold">
            המשך לרישום סטים
          </button>
        </motion.form>
      </div>
    </>
  );
}
