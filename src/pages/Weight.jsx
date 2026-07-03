import { lazy, Suspense, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Scale, TrendingDown, TrendingUp, Minus, Trash2 } from 'lucide-react';
import { useStore } from '../store.jsx';
import { PageHeader, GlassCard, EmptyState, AppLoader, UnitToggle } from '../components/ui.jsx';
import { shortDateHe, formatDateHe, dayKey, vibrate, fmtWeight, toKg, unitLabel, otherUnit } from '../lib/utils.js';

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
                  <GlassCard className="flex items-center gap-3 p-3">
                    <div className="flex-1">
                      <p className="text-sm font-bold">{formatDateHe(b.date)}</p>
                    </div>
                    <span className="flex flex-col items-end">
                      <span className="tnum text-lg font-extrabold leading-tight" style={{ color: 'var(--color-cyan)' }}>
                        {fmtWeight(b.weight, 'kg')}<span className="text-xs text-[var(--color-muted-foreground)]"> ק״ג</span>
                      </span>
                      <span className="tnum text-[10px] font-semibold text-[var(--color-muted-foreground)]">{fmtWeight(b.weight, 'lb')} lb</span>
                    </span>
                    <button
                      onClick={() => { vibrate(8); dispatch({ type: 'deleteBodyWeight', id: b.id }); }}
                      className="press text-[var(--color-muted-foreground)]"
                      aria-label="מחק שקילה"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </GlassCard>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
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
