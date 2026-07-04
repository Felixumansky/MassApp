import { lazy, Suspense, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Pencil, Scale, TrendingDown, TrendingUp, Minus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store.jsx';
import { PageHeader, GlassCard, EmptyState, AppLoader, UnitToggle } from '../components/ui.jsx';
import { shortDateHe, formatDateHe, dayKey, vibrate, fmtWeight, toKg, toUnit, unitLabel, otherUnit } from '../lib/utils.js';
import { useDialogFocus } from '../lib/useDialogFocus.js';

const WeightChart = lazy(() => import('../components/ProgressCharts.jsx').then((m) => ({ default: m.WeightChart })));

export default function Weight() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const { bodyWeights } = state;

  const sorted = useMemo(() => [...bodyWeights].sort((a, b) => (a.date < b.date ? -1 : 1)), [bodyWeights]);
  const chartData = useMemo(
    () => sorted.map((b) => ({ label: shortDateHe(b.date), weight: fmtWeight(b.weight, 'kg'), kg: b.weight })),
    [sorted]
  );

  // Raw kg values; rendering shows both units.
  const stats = useMemo(() => {
    if (sorted.length === 0) return null;
    const latest = sorted.at(-1);
    const prev = sorted.length > 1 ? sorted.at(-2) : null;
    const first = sorted[0];
    return {
      latest: latest.weight,
      sinceLast: prev ? latest.weight - prev.weight : null,
      sinceStart: sorted.length > 1 ? latest.weight - first.weight : null,
    };
  }, [sorted]);

  const [editing, setEditing] = useState(null);   // body weight entry being edited
  const [deleting, setDeleting] = useState(null);  // body weight entry pending delete

  function handleDelete(entry) {
    vibrate(8);
    dispatch({ type: 'deleteBodyWeight', id: entry.id });
    setDeleting(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        subtitle="מעקב"
        title="משקל גוף"
        action={
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/progress'))}
            aria-label="חזור"
            className="press glass flex size-11 shrink-0 items-center justify-center rounded-2xl lg:hidden"
          >
            <ChevronRight className="size-5" />
          </button>
        }
      />

      {stats && (
        <section className="grid grid-cols-3 gap-3">
          <GlassCard className="flex flex-col items-center gap-1 px-2 py-3.5 text-center">
            <Scale className="size-5" style={{ color: 'var(--color-cyan)' }} />
            <span className="tnum text-xl font-extrabold leading-none">{fmtWeight(stats.latest, 'kg')}</span>
            <span className="text-[11px] font-medium text-[var(--color-muted-foreground)]">ק״ג נוכחי</span>
            <span className="tnum text-[10px] font-semibold text-[var(--color-muted-foreground)]">{fmtWeight(stats.latest, 'lb')} lb</span>
          </GlassCard>
          <DeltaCard label="מהשקילה הקודמת" value={stats.sinceLast} />
          <DeltaCard label="מהתחלת המעקב" value={stats.sinceStart} />
        </section>
      )}

      <GlassCard>
        <h2 className="mb-3 font-bold">שקילה חדשה</h2>
        <AddWeightForm onAdd={(weight, date) => dispatch({ type: 'addBodyWeight', weight, date })} />
      </GlassCard>

      {sorted.length === 0 ? (
        <EmptyState icon={Scale} title="אין שקילות עדיין" hint="הוסף שקילה כדי להתחיל לעקוב אחרי מגמת המשקל שלך." />
      ) : (
        <>
          <GlassCard>
            <h2 className="mb-3 font-bold">מגמה</h2>
            <Suspense fallback={<AppLoader label="טוען גרף…" />}>
              <WeightChart data={chartData} unit="kg" />
            </Suspense>
          </GlassCard>

          <section>
            <h2 className="mb-2 font-bold">היסטוריית שקילות</h2>
            <ul className="flex flex-col gap-2">
              {[...sorted].reverse().map((b) => (
                <li key={b.id}>
                  <GlassCard
                    className="flex cursor-pointer items-center gap-3 p-3 transition-all active:scale-[0.98]"
                    onClick={() => setEditing(b)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setEditing(b);
                      }
                    }}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-bold">{formatDateHe(b.date)}</p>
                    </div>
                    <span className="flex flex-col items-end">
                      <span className="tnum text-lg font-extrabold leading-tight" style={{ color: 'var(--color-cyan)' }}>
                        {fmtWeight(b.weight, 'kg')}<span className="text-xs text-[var(--color-muted-foreground)]"> ק״ג</span>
                      </span>
                      <span className="tnum text-[10px] font-semibold text-[var(--color-muted-foreground)]">{fmtWeight(b.weight, 'lb')} lb</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditing(b); }}
                        className="press flex size-8 items-center justify-center rounded-lg text-[var(--color-muted-foreground)]"
                        aria-label="ערוך שקילה"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleting(b); }}
                        className="press flex size-8 items-center justify-center rounded-lg text-[var(--color-muted-foreground)]"
                        aria-label="מחק שקילה"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </GlassCard>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {/* Edit sheet */}
      <EditWeightSheet
        entry={editing}
        onClose={() => setEditing(null)}
        onSave={(id, weight, date) => {
          vibrate(8);
          dispatch({ type: 'updateBodyWeight', id, weight, date });
          setEditing(null);
        }}
      />

      {/* Delete confirmation */}
      <ConfirmDeleteSheet
        entry={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => handleDelete(deleting)}
      />
    </div>
  );
}

function DeltaCard({ label, value }) {
  const has = value != null;
  const dir = has ? Math.sign(value) : 0;
  const Icon = dir > 0 ? TrendingUp : dir < 0 ? TrendingDown : Minus;
  const color = dir > 0 ? 'var(--color-amber)' : dir < 0 ? 'var(--color-volt)' : '#94a3b8';
  const sign = has && value > 0 ? '+' : '';
  return (
    <GlassCard className="flex flex-col items-center gap-1 px-2 py-3.5 text-center">
      <Icon className="size-5" style={{ color }} />
      <span className="tnum text-xl font-extrabold leading-none">
        {has ? `${sign}${fmtWeight(value, 'kg')}` : '—'}
      </span>
      <span className="text-[11px] font-medium text-[var(--color-muted-foreground)]">{has ? `ק״ג ${label}` : label}</span>
      {has && <span className="tnum text-[10px] font-semibold text-[var(--color-muted-foreground)]">{sign}{fmtWeight(value, 'lb')} lb</span>}
    </GlassCard>
  );
}

function AddWeightForm({ onAdd }) {
  const [val, setVal] = useState('');
  const [date, setDate] = useState(dayKey());
  const [unit, setUnit] = useState('kg'); // entry unit for this form only
  const today = dayKey();
  const other = otherUnit(unit);
  const otherVal = val === '' ? '' : fmtWeight(toKg(val, unit), other);

  function submit(e) {
    e.preventDefault();
    if (!val) return;
    vibrate(8);
    onAdd(toKg(val, unit), date);
    setVal('');
    setDate(today);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)}
          className="tnum glass min-w-0 flex-1 rounded-xl px-3 py-2.5 text-sm font-bold outline-none [color-scheme:dark]"
          aria-label="תאריך שקילה"
        />
        <input
          type="number" inputMode="decimal" step="0.1" value={val} onChange={(e) => setVal(e.target.value)}
          placeholder={unitLabel(unit)} className="tnum glass w-20 rounded-xl px-3 py-2.5 text-center text-sm font-bold outline-none"
          aria-label={`משקל ב${unitLabel(unit)}`}
        />
        <UnitToggle unit={unit} onChange={(u) => { vibrate(5); setUnit(u); }} />
        <button type="submit" className="btn-volt press shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold">שמור</button>
      </div>
      {otherVal !== '' && (
        <p className="tnum text-end text-[11px] font-semibold text-[var(--color-muted-foreground)]">≈ {otherVal} {unitLabel(other)}</p>
      )}
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   EditWeightSheet — bottom sheet for editing an existing body weight entry.
   ═══════════════════════════════════════════════════════════════════════ */
function EditWeightSheet({ entry, onClose, onSave }) {
  if (!entry) return null;
  return <EditWeightSheetInner key={entry.id} entry={entry} onClose={onClose} onSave={onSave} />;
}

function EditWeightSheetInner({ entry, onClose, onSave }) {
  const [unit, setUnit] = useState('kg');
  const [val, setVal] = useState(() => String(fmtWeight(entry.weight, 'kg')));
  const [date, setDate] = useState(entry.date);
  const today = dayKey();
  const other = otherUnit(unit);
  const otherVal = val === '' ? '' : fmtWeight(toKg(val, unit), other);
  const dialogRef = useDialogFocus(true, onClose);

  function submit(e) {
    e.preventDefault();
    if (!val) return;
    onSave(entry.id, toKg(val, unit), date);
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
        role="dialog" aria-modal="true" aria-label="עריכת שקילה"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">עריכת שקילה</h2>
          <button type="button" onClick={onClose} className="press glass flex size-9 items-center justify-center rounded-xl" aria-label="סגור">
            <X className="size-4" />
          </button>
        </div>

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
          <span className="flex items-center justify-between">
            משקל
            <UnitToggle unit={unit} onChange={(u) => {
              // Convert the current value to the new unit for display
              if (val !== '') {
                const kg = toKg(val, unit);
                setVal(String(fmtWeight(kg, u)));
              }
              vibrate(5);
              setUnit(u);
            }} />
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={unitLabel(unit)}
            className="tnum glass rounded-2xl px-4 py-3 text-sm font-bold text-[var(--color-card-foreground)] outline-none"
            required
          />
          {otherVal !== '' && (
            <span className="tnum text-end text-[10px] font-semibold text-[var(--color-muted-foreground)]">
              ≈ {otherVal} {unitLabel(other)}
            </span>
          )}
        </label>

        <button type="submit" className="btn-volt press mt-1 rounded-2xl py-3.5 text-sm font-bold">
          שמור שינויים
        </button>
      </motion.form>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ConfirmDeleteSheet — confirmation dialog before deleting a weight entry.
   ═══════════════════════════════════════════════════════════════════════ */
function ConfirmDeleteSheet({ entry, onClose, onConfirm }) {
  const dialogRef = useDialogFocus(!!entry, onClose);
  return (
    <AnimatePresence>
      {entry && (
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
            <h3 className="mb-1 text-lg font-bold">למחוק שקילה?</h3>
            <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
              השקילה מ-{formatDateHe(entry.date)} ({fmtWeight(entry.weight, 'kg')} ק״ג) תימחק לצמיתות.
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
