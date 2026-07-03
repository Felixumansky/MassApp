import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, X, Plus, Minus } from 'lucide-react';
import { fmtDuration, vibrate } from '../lib/utils.js';

const PRESETS = [60, 90, 120, 180];

/** Bottom-docked rest timer. Counts down, buzzes on finish. */
export default function RestTimer({ open, seconds, onClose, onChangeSeconds }) {
  const [remaining, setRemaining] = useState(seconds);
  const tick = useRef(null);

  useEffect(() => {
    if (!open) return;
    setRemaining(seconds);
  }, [open, seconds]);

  useEffect(() => {
    if (!open) return undefined;
    tick.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(tick.current);
          vibrate([900, 80, 900, 80, 900]);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(tick.current);
  }, [open, seconds]);

  const pct = seconds > 0 ? (remaining / seconds) * 100 : 0;
  const done = remaining === 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="solid shadow-[var(--shadow-overlay)] fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md overflow-hidden rounded-2xl p-4 lg:bottom-6"
          role="timer"
          aria-live="polite"
        >
          <div
            className="absolute inset-x-0 top-0 h-1 origin-right transition-[width] duration-1000 ease-linear"
            style={{ width: `${pct}%`, background: done ? 'var(--color-rose)' : 'var(--color-volt)' }}
          />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className="flex size-11 items-center justify-center rounded-2xl"
                style={{ background: done ? 'rgba(251,113,133,0.16)' : 'rgba(198,242,78,0.14)' }}
              >
                <Timer className="size-5" style={{ color: done ? 'var(--color-rose)' : 'var(--color-volt)' }} />
              </span>
              <div>
                <p className="text-xs font-medium text-[var(--color-muted-foreground)]">{done ? 'מנוחה הסתיימה' : 'מנוחה'}</p>
                <p className="tnum text-2xl font-extrabold leading-tight">{fmtDuration(remaining)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { vibrate(5); onChangeSeconds(Math.max(15, seconds - 30)); }}
                className="press glass flex size-10 items-center justify-center rounded-xl"
                aria-label="הפחת 30 שניות"
              >
                <Minus className="size-4" />
              </button>
              <button
                onClick={() => { vibrate(5); onChangeSeconds(seconds + 30); }}
                className="press glass flex size-10 items-center justify-center rounded-xl"
                aria-label="הוסף 30 שניות"
              >
                <Plus className="size-4" />
              </button>
              <button
                onClick={onClose}
                className="press glass flex size-10 items-center justify-center rounded-xl"
                aria-label="סגור טיימר"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => { vibrate(5); onChangeSeconds(p); }}
                className="press flex-1 rounded-xl py-1.5 text-xs font-bold"
                style={{
                  background: seconds === p ? 'rgba(198,242,78,0.16)' : 'rgba(255,255,255,0.05)',
                  color: seconds === p ? 'var(--color-volt)' : '#94a3b8',
                }}
              >
                {p}ש׳
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
