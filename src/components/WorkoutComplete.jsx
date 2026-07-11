import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Layers, Dumbbell, ListChecks, Sparkles, Copy, Check } from 'lucide-react';
import { fmtDuration, fmtWeight, fmtWeightBoth, unitLabel, otherUnit } from '../lib/utils.js';
import { useDialogFocus } from '../lib/useDialogFocus.js';

const CONFETTI = ['#c6f24e', '#38bdf8', '#a78bfa', '#fbbf24', '#fb7185'];

/** Celebratory post-workout summary. Mounts with confetti + glow. */
export default function WorkoutComplete({ open, summary, unit = 'kg', sourceRoutine = null, onDuplicate, onDone }) {
  const dialogRef = useDialogFocus(open, onDone);
  const [duplicated, setDuplicated] = useState(false);
  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.25,
        rot: Math.random() * 360,
        color: CONFETTI[i % CONFETTI.length],
        size: 6 + Math.random() * 6,
      })),
    [open]
  );

  return (
    <AnimatePresence>
      {open && summary && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md"
          />

          {/* confetti */}
          <div className="pointer-events-none fixed inset-0 z-[61] overflow-hidden" aria-hidden="true">
            {pieces.map((p) => (
              <motion.span
                key={p.id}
                initial={{ y: '-10%', opacity: 0, rotate: 0 }}
                animate={{ y: '110vh', opacity: [0, 1, 1, 0], rotate: p.rot }}
                transition={{ duration: 2.4, delay: p.delay, ease: 'easeIn' }}
                className="absolute top-0 rounded-[2px]"
                style={{ left: `${p.x}%`, width: p.size, height: p.size * 1.6, background: p.color }}
              />
            ))}
          </div>

          <div className="fixed inset-0 z-[62] flex items-center justify-center p-4">
          <motion.div
            ref={dialogRef}
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="solid shadow-[var(--shadow-overlay)] max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl p-6 text-center"
            role="dialog" aria-modal="true" aria-label="סיכום אימון"
          >
            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
              className="btn-volt pulse-glow mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl"
            >
              <Trophy className="size-8" strokeWidth={2.2} />
            </motion.span>

            <h2 className="text-2xl font-extrabold">אימון הושלם! 💪</h2>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{summary.name}</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Stat icon={Clock} color="var(--color-volt)" value={fmtDuration(summary.durationSec)} label="משך" />
              <Stat icon={ListChecks} color="var(--color-cyan)" value={summary.totalSets} label="סטים" />
              <Stat
                icon={Layers}
                color="var(--color-violet)"
                value={fmtWeight(summary.totalVolume, unit).toLocaleString()}
                label={`${unitLabel(unit)} נפח · ${fmtWeight(summary.totalVolume, otherUnit(unit)).toLocaleString()} ${unitLabel(otherUnit(unit))}`}
              />
              <Stat icon={Dumbbell} color="var(--color-amber)" value={summary.exerciseCount} label="תרגילים" />
            </div>

            {summary.personalRecords?.length > 0 && (
              <div className="mt-4 flex flex-col gap-1.5 rounded-2xl bg-[rgba(198,242,78,0.1)] p-3 text-start">
                <p className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-volt)]">
                  <Sparkles className="size-3.5" /> שיא אישי חדש!
                </p>
                {summary.personalRecords.slice(0, 3).map((pr) => (
                  <p key={pr.name} className="tnum text-sm font-semibold">
                    {pr.name} · {fmtWeightBoth(pr.weight, unit)} × {pr.reps}
                  </p>
                ))}
              </div>
            )}

            {sourceRoutine && (
              <button
                onClick={() => { if (!duplicated) { onDuplicate?.(); setDuplicated(true); } }}
                disabled={duplicated}
                className="press glass mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold disabled:opacity-70"
              >
                {duplicated
                  ? <><Check className="size-4 text-[var(--color-volt)]" /> שוכפל ✓</>
                  : <><Copy className="size-4 text-[var(--color-volt)]" /> שכפל תוכנית זו</>}
              </button>
            )}

            <button onClick={onDone} className={`btn-volt press w-full rounded-2xl py-3.5 text-base font-bold ${sourceRoutine ? 'mt-3' : 'mt-6'}`}>
              סיום
            </button>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function Stat({ icon: Icon, color, value, label }) {
  return (
    <div className="glass flex flex-col items-center gap-1 px-2 py-3.5">
      <Icon className="size-5" style={{ color }} />
      <span className="tnum text-xl font-extrabold leading-none">{value}</span>
      <span className="text-[11px] font-medium text-[var(--color-muted-foreground)]">{label}</span>
    </div>
  );
}
