import { lazy, Suspense, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dumbbell, TrendingUp, AlertTriangle } from 'lucide-react';
import { muscleById } from '../lib/exercises.js';
import { exerciseMediaUrl } from '../lib/api.js';
import { exerciseE1rmSeries, detectPlateau } from '../lib/analytics.js';
import { fmtWeight, fmtWeightBoth, shortDateHe } from '../lib/utils.js';
import { MuscleTag, AppLoader } from './ui.jsx';
import { useDialogFocus } from '../lib/useDialogFocus.js';

const E1rmChart = lazy(() => import('./ProgressCharts.jsx').then((m) => ({ default: m.E1rmChart })));

/** Bottom-sheet showing a single exercise: GIF demo, muscles, equipment, steps.
 *  `exercise` is the resolved catalog object (or null → closed). */
export default function ExerciseDetail({ exercise, workouts = [], unit = 'kg', onClose }) {
  const open = !!exercise;
  const dialogRef = useDialogFocus(open, onClose);
  const [imgFailed, setImgFailed] = useState(false);
  const [stepsLang, setStepsLang] = useState('he');

  // reset per-exercise state whenever a different exercise opens
  useEffect(() => { setImgFailed(false); setStepsLang('he'); }, [exercise?.id]);

  const m = exercise ? muscleById(exercise.muscle) : null;
  const gif = exercise ? exerciseMediaUrl(exercise.mediaId) : '';
  const stepsHe = exercise?.steps || [];
  const stepsEn = exercise?.steps_en || [];
  const hasBoth = stepsHe.length > 0 && stepsEn.length > 0;
  const showEn = stepsLang === 'en' && stepsEn.length > 0;
  const steps = showEn ? stepsEn : stepsHe;
  const secondary = exercise?.secondaryMuscles || [];

  // Feature 2 — estimated‑1RM progression + plateau detection for this exercise.
  const series = useMemo(
    () => (exercise ? exerciseE1rmSeries(workouts, exercise.id) : []),
    [workouts, exercise]
  );
  const chartData = useMemo(
    () => series.map((p) => ({ label: shortDateHe(p.date), value: fmtWeight(p.e1rm, unit), kg: p.e1rm })),
    [series, unit]
  );
  const plateau = useMemo(() => detectPlateau(series), [series]);
  const bestE1rm = series.length ? Math.max(...series.map((p) => p.e1rm)) : 0;

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
            className="solid shadow-[var(--shadow-overlay)] fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] max-w-md flex-col rounded-t-2xl p-4 pb-[max(1rem,var(--safe-b))]"
            role="dialog"
            aria-modal="true"
            aria-label={exercise?.name}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/15" />

            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold">{exercise?.name}</h2>
                {exercise?.name_en && exercise.name_en !== exercise.name && (
                  <p dir="ltr" className="truncate text-start text-xs text-[var(--color-muted-foreground)]">
                    {exercise.name_en}
                  </p>
                )}
              </div>
              <button onClick={onClose} className="press glass flex size-9 shrink-0 items-center justify-center rounded-xl" aria-label="סגור">
                <X className="size-4" />
              </button>
            </div>

            <div className="-mx-1 flex-1 overflow-y-auto px-1">
              {/* GIF demo (falls back to an icon when there is no media / it fails to load) */}
              <div
                className="mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl"
                style={{ background: `${m?.color}14` }}
              >
                {gif && !imgFailed ? (
                  <img
                    src={gif}
                    alt={exercise?.name_en || exercise?.name}
                    loading="lazy"
                    onError={() => setImgFailed(true)}
                    className="size-full object-contain"
                  />
                ) : (
                  <Dumbbell className="size-12" style={{ color: m?.color }} />
                )}
              </div>

              {/* tags: muscle (Hebrew) + equipment + target (English metadata) */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <MuscleTag muscle={exercise?.muscle} />
                {exercise?.equipment && <MetaChip>{exercise.equipment}</MetaChip>}
                {exercise?.target && <MetaChip>{exercise.target}</MetaChip>}
              </div>

              {secondary.length > 0 && (
                <p dir="ltr" className="mb-3 text-start text-xs text-[var(--color-muted-foreground)]">
                  Secondary: {secondary.join(', ')}
                </p>
              )}

              {/* progression: estimated 1RM over time + plateau warning */}
              {series.length >= 2 && (
                <div className="mb-4 rounded-2xl border border-[var(--hairline)] bg-white/[0.02] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-1.5 text-sm font-bold">
                      <TrendingUp className="size-4 text-[var(--color-volt)]" /> התקדמות
                    </h3>
                    <span className="tnum text-xs text-[var(--color-muted-foreground)]">
                      שיא 1RM {fmtWeightBoth(bestE1rm, unit)}
                    </span>
                  </div>
                  <Suspense fallback={<AppLoader label="טוען גרף…" />}>
                    <E1rmChart data={chartData} unit={unit} />
                  </Suspense>
                  {plateau && (
                    <p className="mt-2 flex items-center gap-1.5 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-200">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      פלטו — 3 אימונים ללא שיפור. שקול להעלות משקל, להוסיף סט, או לשנות טווח חזרות.
                    </p>
                  )}
                </div>
              )}

              {hasBoth && (
                <div className="mb-2 flex justify-end">
                  <button
                    onClick={() => setStepsLang(showEn ? 'he' : 'en')}
                    className="press rounded-md border border-[var(--hairline)] px-2 py-0.5 text-xs font-medium text-[var(--color-muted-foreground)]"
                  >
                    {showEn ? 'עברית' : 'English'}
                  </button>
                </div>
              )}

              {steps.length > 0 ? (
                <ol dir={showEn ? 'ltr' : 'rtl'} className="flex list-none flex-col gap-2 text-start">
                  {steps.map((s, i) => (
                    <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
                      <span
                        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={{ background: `${m?.color}24`, color: m?.color }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-[var(--color-foreground)]/90">{s}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="py-4 text-center text-sm text-[var(--color-muted-foreground)]">אין הוראות ביצוע לתרגיל זה.</p>
              )}

              <p className="mt-4 text-center text-[10px] text-[var(--color-muted-foreground)]">
                נתוני תרגילים ו-GIF © ExerciseDB · exercisedb.dev
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MetaChip({ children }) {
  return (
    <span dir="ltr" className="rounded-md border border-[var(--hairline)] px-2 py-0.5 text-xs font-medium capitalize text-[var(--color-muted-foreground)]">
      {children}
    </span>
  );
}
