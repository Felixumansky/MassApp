import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, X, Plus, Minus } from 'lucide-react';
import { fmtDuration, vibrate } from '../lib/utils.js';
import { scheduleRestEnd, cancelRestEnd } from '../lib/restNotify.js';

const PRESETS = [60, 90, 120, 180];
const FINISH_PATTERN = [900, 80, 900, 80, 900];

/** Bottom-docked rest timer. Counts down, buzzes on finish — even in the background. */
export default function RestTimer({ open, seconds, onClose, onChangeSeconds }) {
  const [remaining, setRemaining] = useState(seconds);
  const tick = useRef(null);

  useEffect(() => {
    if (!open) {
      cancelRestEnd();
      return undefined;
    }

    // Drive the countdown off an absolute end time so it stays accurate across
    // backgrounding (JS timers are throttled/frozen while the app is hidden).
    const endAt = Date.now() + seconds * 1000;
    let finished = false;
    let osOwnsBuzz = false; // OS notification scheduled -> it delivers the finish buzz
    setRemaining(seconds);

    const step = () => {
      const r = Math.round((endAt - Date.now()) / 1000);
      if (r <= 0) {
        clearInterval(tick.current);
        setRemaining(0);
        if (!finished) {
          finished = true;
          // Only buzz in-app if the OS hasn't already handled it in the background.
          if (document.visibilityState === 'visible' && !osOwnsBuzz) vibrate(FINISH_PATTERN);
        }
        cancelRestEnd();
        return;
      }
      setRemaining(r);
    };

    const onVisibility = () => {
      if (finished) return;
      if (document.visibilityState === 'hidden') {
        // App is leaving the foreground — hand the finish buzz to the OS.
        osOwnsBuzz = true;
        scheduleRestEnd(endAt);
      } else {
        // Back in the foreground: JS drives the buzz again, catch up immediately.
        osOwnsBuzz = false;
        cancelRestEnd();
        step();
      }
    };

    tick.current = setInterval(step, 250);
    document.addEventListener('visibilitychange', onVisibility);
    if (document.visibilityState === 'hidden') {
      osOwnsBuzz = true;
      scheduleRestEnd(endAt);
    }

    return () => {
      clearInterval(tick.current);
      document.removeEventListener('visibilitychange', onVisibility);
      cancelRestEnd();
    };
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
