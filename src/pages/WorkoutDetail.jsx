import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Dumbbell,
  Eye,
  Layers,
  ListChecks,
  Pencil,
  Plus,
  Save,
  StickyNote,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import { useStore } from '../store.jsx';
import { GlassCard, MuscleTag, PageHeader, WeightInput, UnitToggle } from '../components/ui.jsx';
import ExercisePicker from '../components/ExercisePicker.jsx';
import {
  fmtDuration,
  formatDateHe,
  workoutVolume,
  workoutSetCount,
  fmtWeightBoth,
  fmtWeight,
  unitLabel,
  epley1rm,
  vibrate,
  dayKey,
  uid,
  compressImage,
} from '../lib/utils.js';
import { resolveExercise } from '../lib/exercises.js';
import { useDialogFocus } from '../lib/useDialogFocus.js';

/* ═══════════════════════════════════════════════════════════════════════
   WorkoutDetail — full detail page for a past workout.
   Two modes:
     • View (default) — read-only, beautiful summary of the workout.
     • Edit — inline editing of all fields: name, date, duration, exercises,
       sets (reps/weight/RPE), notes. Saves via 'updateWorkout' action.
   ═══════════════════════════════════════════════════════════════════════ */

export default function WorkoutDetail() {
  const { id } = useParams();
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const unit = state.profile.unit || 'kg';
  const exerciseUnits = state.profile.exerciseUnits || {};

  const workout = state.workouts.find((w) => w.id === id);

  /* ── Edit mode state ─────────────────────────────────────────── */
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null); // deep clone while editing
  const [picker, setPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Start editing: deep-clone the workout so we can freely mutate
  function startEdit() {
    setDraft(structuredClone(workout));
    setEditing(true);
  }

  /** Check if the draft differs from the saved workout. */
  function isDirty() {
    if (!draft || !workout) return false;
    return JSON.stringify(draft) !== JSON.stringify(workout);
  }

  function cancelEdit() {
    if (isDirty()) {
      setConfirmDiscard(true);
      return;
    }
    setDraft(null);
    setEditing(false);
  }

  function forceDiscard() {
    setConfirmDiscard(false);
    setDraft(null);
    setEditing(false);
  }

  function saveEdit() {
    if (!draft) return;
    vibrate(8);
    // Build patch: everything that can change
    dispatch({
      type: 'updateWorkout',
      id: workout.id,
      patch: {
        name: draft.name,
        date: draft.date,
        durationSec: draft.durationSec,
        exercises: draft.exercises,
      },
    });
    setDraft(null);
    setEditing(false);
  }

  function handleDelete() {
    vibrate(8);
    dispatch({ type: 'deleteWorkout', id: workout.id });
    navigate(-1);
  }

  function editFull() {
    if (state.active) {
      alert('יש אימון פעיל. סיים או בטל אותו לפני עריכה מלאה.');
      return;
    }
    vibrate(8);
    dispatch({ type: 'editWorkout', id: workout.id });
    navigate('/workout');
  }

  if (!workout) {
    return (
      <div className="fade-up flex flex-col items-center gap-4 py-16 text-center">
        <Dumbbell className="size-10 text-[var(--color-muted-foreground)]" />
        <p className="text-lg font-bold">האימון לא נמצא</p>
        <button onClick={() => navigate(-1)} className="btn-volt press rounded-2xl px-5 py-2.5 text-sm font-bold">
          חזרה
        </button>
      </div>
    );
  }

  const data = editing && draft ? draft : workout;
  const totalVolume = workoutVolume(data);
  const totalSets = workoutSetCount(data);
  const muscles = [...new Set((data.exercises || []).map((e) => e.muscle))];
  const durationMin = Math.max(1, Math.round((Number(data.durationSec) || 60) / 60));

  return (
    <div className="pb-4">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="fade-up mb-5 flex items-start justify-between gap-3 pt-2">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="press glass flex size-10 shrink-0 items-center justify-center rounded-xl"
            aria-label="חזרה"
          >
            <ArrowRight className="size-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold">{data.name || 'אימון'}</h1>
            <p className="text-xs text-[var(--color-muted-foreground)]">{formatDateHe(data.date)}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {editing ? (
            <>
              <button
                onClick={cancelEdit}
                className="press glass flex size-10 items-center justify-center rounded-xl text-[var(--color-muted-foreground)]"
                aria-label="בטל עריכה"
              >
                <X className="size-4" />
              </button>
              <button
                onClick={saveEdit}
                className="btn-volt press flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-bold"
                aria-label="שמור"
              >
                <Save className="size-4" /> שמור
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEdit}
                className="press glass flex size-10 items-center justify-center rounded-xl text-[var(--color-muted-foreground)]"
                aria-label="ערוך אימון"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="press glass flex size-10 items-center justify-center rounded-xl text-[var(--color-muted-foreground)]"
                aria-label="מחק אימון"
              >
                <Trash2 className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Summary stats ────────────────────────────────────── */}
      <section className="fade-up mb-5 grid grid-cols-3 gap-3" style={{ '--d': '0.05s' }}>
        <StatCard icon={Clock} color="var(--color-volt)" value={fmtDuration(data.durationSec || 0)} label="משך" />
        <StatCard icon={ListChecks} color="var(--color-cyan)" value={totalSets} label="סטים" />
        <StatCard
          icon={Layers}
          color="var(--color-violet)"
          value={fmtWeight(totalVolume, unit).toLocaleString()}
          label={`${unitLabel(unit)} נפח`}
        />
      </section>

      {/* ── Muscle tags ──────────────────────────────────────── */}
      {muscles.length > 0 && (
        <div className="fade-up mb-4 flex flex-wrap gap-1.5">
          {muscles.map((m) => (
            <MuscleTag key={m} muscle={m} />
          ))}
        </div>
      )}

      {/* ── Edit mode: meta fields ───────────────────────────── */}
      {editing && draft && (
        <GlassCard className="fade-up mb-4 grid grid-cols-1 gap-3 p-3.5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)] sm:col-span-2">
            שם אימון
            <input
              value={draft.name || ''}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="שם האימון"
              className="rounded-xl bg-white/[0.04] px-3 py-2.5 text-sm font-bold text-[var(--color-card-foreground)] outline-none placeholder:font-normal placeholder:text-[var(--color-muted-foreground)]"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
            תאריך
            <span className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5">
              <CalendarIcon className="size-4 text-[var(--color-cyan)]" />
              <input
                type="date"
                value={draft.date || dayKey()}
                max={dayKey()}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                className="tnum min-w-0 flex-1 bg-transparent text-sm font-bold text-[var(--color-card-foreground)] outline-none [color-scheme:dark]"
              />
            </span>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
            משך בדקות
            <span className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5">
              <Timer className="size-4 text-[var(--color-volt)]" />
              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={durationMin}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    durationSec: Math.max(1, Number(e.target.value) || 1) * 60,
                  })
                }
                className="tnum min-w-0 flex-1 bg-transparent text-sm font-bold text-[var(--color-card-foreground)] outline-none"
              />
            </span>
          </label>

          <div className="sm:col-span-2">
            <button
              onClick={editFull}
              className="press glass flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold"
            >
              <Dumbbell className="size-4 text-[var(--color-volt)]" /> עריכה מלאה — תרגילים וסטים
            </button>
          </div>
        </GlassCard>
      )}

      {/* ── Exercises list ───────────────────────────────────── */}
      <h2 className="fade-up mb-3 text-lg font-bold">
        תרגילים ({(data.exercises || []).length})
      </h2>

      <ul className="flex flex-col gap-4">
        <AnimatePresence initial={false}>
          {(data.exercises || []).map((ex, exIdx) => (
            <motion.li
              key={ex.uid || exIdx}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            >
              {editing && draft ? (
                <EditExerciseCard
                  ex={ex}
                  exIdx={exIdx}
                  unit={exerciseUnits[ex.exerciseId] || unit}
                  draft={draft}
                  setDraft={setDraft}
                />
              ) : (
                <ViewExerciseCard ex={ex} unit={exerciseUnits[ex.exerciseId] || unit} />
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {/* ── Edit: add exercise button ────────────────────────── */}
      {editing && draft && (
        <>
          <button
            onClick={() => setPicker(true)}
            className="press glass mt-4 flex w-full items-center justify-center gap-2 rounded-[var(--r-lg)] py-3.5 text-sm font-bold"
          >
            <Plus className="size-4 text-[var(--color-volt)]" /> הוסף תרגיל
          </button>

          <ExercisePicker
            open={picker}
            onClose={() => setPicker(false)}
            onPick={(exerciseId) => {
              const ex = resolveExercise(exerciseId, state.customExercises);
              const newExercise = {
                uid: uid(),
                exerciseId,
                name: ex?.name ?? exerciseId,
                muscle: ex?.muscle ?? 'chest',
                targetSets: 3,
                targetReps: '',
                note: '',
                sets: [{ id: uid(), reps: '', weight: '', rpe: '', done: true }],
              };
              setDraft({
                ...draft,
                exercises: [...(draft.exercises || []), newExercise],
              });
              setPicker(false);
            }}
          />
        </>
      )}

      {/* ── Total volume footer ──────────────────────────────── */}
      {(data.exercises || []).length > 0 && (
        <p className="tnum mt-4 text-center text-xs text-[var(--color-muted-foreground)]">
          נפח כולל: {fmtWeightBoth(totalVolume, unit)}
        </p>
      )}

      {/* ── Delete confirmation dialog ───────────────────────── */}
      <ConfirmDeleteDialog
        open={confirmDelete}
        name={workout.name}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />

      {/* ── Discard changes confirmation ─────────────────────── */}
      <ConfirmDiscardDialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onDiscard={forceDiscard}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   View-only exercise card — shows all set data in a clean table.
   ═══════════════════════════════════════════════════════════════════════ */
function ViewExerciseCard({ ex, unit }) {
  const [collapsed, setCollapsed] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const bestSet = useMemo(() => {
    let best = null;
    let bestE1 = 0;
    for (const s of ex.sets || []) {
      if (!s.weight || !s.reps) continue;
      const e1 = epley1rm(s.weight, s.reps);
      if (e1 > bestE1) {
        bestE1 = e1;
        best = s;
      }
    }
    return best;
  }, [ex.sets]);

  return (
    <GlassCard className="flex flex-col gap-3 overflow-hidden p-3.5">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((c) => !c)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setCollapsed((c) => !c);
          }
        }}
        className="flex cursor-pointer items-center justify-between gap-2"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2.5">
          <span className="font-bold text-[var(--color-amber)]">{ex.name}</span>
          <MuscleTag muscle={ex.muscle} />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="tnum text-xs font-bold text-[var(--color-volt)]">
            {ex.sets?.length || 0} סטים
          </span>
          <ChevronDown
            className={`size-4 text-[var(--color-muted-foreground)] transition-transform ${collapsed ? '' : 'rotate-180'}`}
          />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-2.5 overflow-hidden"
          >
            {/* Sets table header */}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-[var(--color-muted-foreground)]">
              <span>סט</span>
              <span>חזרות</span>
              <span>משקל ({unitLabel(unit)})</span>
            </div>

            {/* Sets rows */}
            {(ex.sets || []).map((s, i) => {
              const isBest = bestSet && s.id === bestSet.id;
              return (
                <div
                  key={s.id || i}
                  className={`grid grid-cols-3 gap-2 rounded-xl border px-2.5 py-2.5 text-center ${
                    isBest
                      ? 'border-[var(--color-volt)]/30 bg-[var(--color-volt)]/[0.06]'
                      : 'border-[var(--hairline)] bg-white/[0.025]'
                  }`}
                >
                  <span className="tnum text-sm font-bold text-[var(--color-muted-foreground)]">{i + 1}</span>
                  <span className="tnum text-sm font-bold text-[var(--color-card-foreground)]">
                    {s.reps || '—'}
                  </span>
                  <span className="tnum text-sm font-bold text-[var(--color-card-foreground)]">
                    {s.weight ? fmtWeight(s.weight, unit) : '—'}
                  </span>
                </div>
              );
            })}

            {/* Best set callout */}
            {bestSet && (
              <p className="tnum text-center text-[11px] font-semibold text-[var(--color-volt)]">
                ⭐ סט מוביל: {fmtWeightBoth(bestSet.weight, unit)} × {bestSet.reps}
                {' '}(1RM ≈ {fmtWeightBoth(epley1rm(bestSet.weight, bestSet.reps), unit)})
              </p>
            )}

            {/* Note */}
            {ex.note && (
              <div className="flex items-start gap-2 rounded-xl bg-white/[0.035] px-3 py-2 text-xs">
                <StickyNote className="mt-0.5 size-4 shrink-0 text-[var(--color-muted-foreground)]" />
                <span className="text-sm font-semibold text-[var(--color-card-foreground)]">{ex.note}</span>
              </div>
            )}

            {/* Photo */}
            {ex.photo && (
              <div className="relative self-start">
                <button
                  onClick={() => setLightbox(true)}
                  className="press block overflow-hidden rounded-xl border border-[var(--hairline)]"
                  aria-label="הגדל תמונה"
                >
                  <img src={ex.photo} alt={`תמונה — ${ex.name}`} className="size-16 object-cover" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <PhotoLightbox open={lightbox} src={ex.photo} name={ex.name} onClose={() => setLightbox(false)} />
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Editable exercise card — inline editing for sets within the detail.
   ═══════════════════════════════════════════════════════════════════════ */
function EditExerciseCard({ ex, exIdx, unit, draft, setDraft }) {
  const [collapsed, setCollapsed] = useState(false);
  const fileRef = useRef(null);

  function updateExercise(patch) {
    const exercises = draft.exercises.map((e, i) => (i === exIdx ? { ...e, ...patch } : e));
    setDraft({ ...draft, exercises });
  }

  function updateSet(setIdx, patch) {
    const newSets = ex.sets.map((s, i) => (i === setIdx ? { ...s, ...patch } : s));
    updateExercise({ sets: newSets });
  }

  function addSet() {
    const lastSet = ex.sets.at(-1);
    updateExercise({
      sets: [
        ...ex.sets,
        { id: uid(), reps: lastSet?.reps || '', weight: lastSet?.weight || '', rpe: '', done: true },
      ],
    });
  }

  function removeSet(setIdx) {
    updateExercise({ sets: ex.sets.filter((_, i) => i !== setIdx) });
  }

  function removeExercise() {
    setDraft({ ...draft, exercises: draft.exercises.filter((_, i) => i !== exIdx) });
  }

  async function pickPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const url = await compressImage(file);
    if (url) updateExercise({ photo: url });
  }

  return (
    <GlassCard className="flex flex-col gap-3 overflow-hidden border border-[var(--color-volt)]/20 p-3.5">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((c) => !c)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setCollapsed((c) => !c);
          }
        }}
        className="flex cursor-pointer items-center justify-between gap-2"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2.5">
          <span className="font-bold text-[var(--color-amber)]">{ex.name}</span>
          <MuscleTag muscle={ex.muscle} />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeExercise();
            }}
            className="press flex size-8 items-center justify-center rounded-lg text-[var(--color-muted-foreground)]"
            aria-label="הסר תרגיל"
          >
            <Trash2 className="size-4" />
          </button>
          <ChevronDown
            className={`size-4 text-[var(--color-muted-foreground)] transition-transform ${collapsed ? '' : 'rotate-180'}`}
          />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-2.5 overflow-hidden"
          >
            {/* Sets table header */}
            <div className="hidden grid-cols-[1.7rem_minmax(0,1fr)_minmax(0,1fr)_2.2rem] gap-1.5 text-center text-[11px] font-semibold text-[var(--color-muted-foreground)] sm:grid">
              <span>סט</span>
              <span>חזרות</span>
              <span>משקל ({unitLabel(unit)})</span>
              <span />
            </div>

            {/* Editable sets */}
            {(ex.sets || []).map((s, i) => (
              <div
                key={s.id || i}
                className="grid grid-cols-1 gap-2 rounded-xl border border-[var(--hairline)] bg-white/[0.025] p-2.5 sm:grid-cols-[1.7rem_minmax(0,1fr)_minmax(0,1fr)_2.2rem] sm:items-center sm:gap-1.5 sm:border-0 sm:bg-transparent sm:p-0"
              >
                <span className="flex items-center justify-between text-xs font-semibold text-[var(--color-muted-foreground)] sm:block sm:text-center">
                  <span className="sm:hidden">סט</span>
                  <span className="tnum text-sm font-bold">{i + 1}</span>
                </span>
                <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-muted-foreground)] sm:block">
                  <span className="sm:hidden">חזרות</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={s.reps}
                    onChange={(e) => updateSet(i, { reps: e.target.value })}
                    placeholder="—"
                    className="tnum min-w-0 rounded-xl bg-white/5 py-2.5 text-center text-base font-bold text-[var(--color-card-foreground)] outline-none focus:bg-white/10 sm:w-full"
                    aria-label={`חזרות סט ${i + 1}`}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-muted-foreground)] sm:block">
                  <span className="sm:hidden">משקל ({unitLabel(unit)})</span>
                  <WeightInput
                    kg={s.weight}
                    unit={unit}
                    onCommit={(kg) => updateSet(i, { weight: kg })}
                    placeholder="—"
                    className="tnum min-w-0 rounded-xl bg-white/5 py-2.5 text-center text-base font-bold text-[var(--color-card-foreground)] outline-none focus:bg-white/10 sm:w-full"
                    aria-label={`משקל סט ${i + 1}`}
                  />
                </label>
                {ex.sets.length > 1 && (
                  <button
                    onClick={() => removeSet(i)}
                    className="press flex size-9 items-center justify-center self-center rounded-lg text-[var(--color-muted-foreground)] sm:size-auto"
                    aria-label={`מחק סט ${i + 1}`}
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            ))}

            {/* Note */}
            <label className="flex items-start gap-2 rounded-xl bg-white/[0.035] px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
              <StickyNote className="mt-0.5 size-4 shrink-0" />
              <textarea
                value={ex.note || ''}
                onChange={(e) => updateExercise({ note: e.target.value })}
                placeholder="הערה לתרגיל"
                rows={1}
                className="min-h-6 flex-1 resize-none bg-transparent text-sm font-semibold text-[var(--color-card-foreground)] outline-none placeholder:font-normal placeholder:text-[var(--color-muted-foreground)]"
              />
            </label>

            {/* Photo */}
            {ex.photo && (
              <div className="relative self-start">
                <img src={ex.photo} alt={`תמונה — ${ex.name}`} className="size-16 rounded-xl border border-[var(--hairline)] object-cover" />
                <button
                  onClick={() => updateExercise({ photo: undefined })}
                  className="press absolute -end-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-black/70 text-white"
                  aria-label="הסר תמונה"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button onClick={addSet} className="press flex-1 rounded-xl bg-white/5 py-2 text-xs font-bold text-[var(--color-muted-foreground)]">
                + סט
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="press flex items-center justify-center gap-1 rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-[var(--color-muted-foreground)]"
              >
                📷 תמונה
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
function StatCard({ icon: Icon, color, value, label }) {
  return (
    <GlassCard className="flex flex-col items-center gap-1 px-2 py-3.5 text-center">
      <Icon className="size-5" style={{ color }} />
      <span className="tnum text-xl font-extrabold leading-none">{value}</span>
      <span className="text-[11px] font-medium text-[var(--color-muted-foreground)]">{label}</span>
    </GlassCard>
  );
}

function PhotoLightbox({ open, src, name, onClose }) {
  const dialogRef = useDialogFocus(open, onClose);
  return (
    <AnimatePresence>
      {open && src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`תמונה — ${name}`}
        >
          <div ref={dialogRef} className="contents">
            <button
              onClick={onClose}
              className="press absolute end-4 top-4 flex size-10 items-center justify-center rounded-xl bg-white/10 text-white"
              aria-label="סגור תמונה"
            >
              <X className="size-5" />
            </button>
            <motion.img
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={src}
              alt={`תמונה — ${name}`}
              className="max-h-[85dvh] w-full max-w-2xl rounded-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ConfirmDeleteDialog({ open, name, onClose, onConfirm }) {
  const dialogRef = useDialogFocus(open, onClose);
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
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="solid shadow-[var(--shadow-overlay)] fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-2xl p-5 pb-[max(1.25rem,var(--safe-b))]"
            role="dialog"
            aria-modal="true"
          >
            <h3 className="mb-1 text-lg font-bold">למחוק את האימון?</h3>
            <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
              האימון &quot;{name || 'אימון'}&quot; יימחק לצמיתות.
            </p>
            <div className="flex gap-2">
              <button onClick={onClose} className="press glass flex-1 rounded-2xl py-3 text-sm font-bold">
                ביטול
              </button>
              <button
                onClick={onConfirm}
                className="press flex-1 rounded-2xl bg-rose-500/90 py-3 text-sm font-bold text-white"
              >
                מחק
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ConfirmDiscardDialog({ open, onClose, onDiscard }) {
  const dialogRef = useDialogFocus(open, onClose);
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
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="solid shadow-[var(--shadow-overlay)] fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-2xl p-5 pb-[max(1.25rem,var(--safe-b))]"
            role="dialog"
            aria-modal="true"
          >
            <h3 className="mb-1 text-lg font-bold">לצאת ללא שמירה?</h3>
            <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
              יש שינויים שלא נשמרו. אם תצא עכשיו, השינויים יאבדו.
            </p>
            <div className="flex gap-2">
              <button onClick={onClose} className="press glass flex-1 rounded-2xl py-3 text-sm font-bold">
                המשך עריכה
              </button>
              <button
                onClick={onDiscard}
                className="press flex-1 rounded-2xl bg-rose-500/90 py-3 text-sm font-bold text-white"
              >
                צא ללא שמירה
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
