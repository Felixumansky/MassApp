import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronRight, ChevronLeft, Search, Plus, X } from 'lucide-react';
import { useStore } from '../store.jsx';
import { PageHeader, GlassCard, EmptyState } from '../components/ui.jsx';
import WorkoutHistoryList from '../components/WorkoutHistory.jsx';
import RetroWorkoutSheet from '../components/RetroWorkoutSheet.jsx';
import { dayKey, formatDateHe } from '../lib/utils.js';
import { MUSCLES } from '../lib/exercises.js';

const HE_MONTHS_FULL = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];
const WEEKDAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

/** YYYY-MM-DD for a given year/month(0-based)/day, local time. */
function ymd(year, month, day) {
  return dayKey(new Date(year, month, day));
}

/** Does a workout match the free-text query (name or any exercise name)? */
function matchesQuery(w, q) {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  if ((w.name || '').toLowerCase().includes(needle)) return true;
  return (w.exercises || []).some((e) => (e.name || '').toLowerCase().includes(needle));
}

function matchesMuscle(w, muscle) {
  if (!muscle) return true;
  return (w.exercises || []).some((e) => e.muscle === muscle);
}

export default function Calendar() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const { workouts, profile } = state;
  const unit = profile.unit || 'kg';

  const today = dayKey();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selected, setSelected] = useState(today);
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const filtering = query.trim() !== '' || muscle !== '';

  // Map of date -> number of workouts, for the green dots.
  const countByDate = useMemo(() => {
    const map = new Map();
    for (const w of workouts) map.set(w.date, (map.get(w.date) || 0) + 1);
    return map;
  }, [workouts]);

  // Calendar grid cells for the visible month (with leading blanks).
  const cells = useMemo(() => {
    const { year, month } = cursor;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < firstDay; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(ymd(year, month, d));
    return out;
  }, [cursor]);

  // Workouts shown below the grid: either the filtered set or the selected day.
  const listWorkouts = useMemo(() => {
    if (filtering) {
      return workouts.filter((w) => matchesQuery(w, query) && matchesMuscle(w, muscle));
    }
    return workouts.filter((w) => w.date === selected);
  }, [workouts, filtering, query, muscle, selected]);

  function shiftMonth(delta) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function goToday() {
    const d = new Date();
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
    setSelected(today);
  }

  return (
    <div>
      <PageHeader
        subtitle="יומן"
        title="האימונים שלי"
        action={
          <button
            onClick={() => setAddOpen(true)}
            aria-label="הוסף אימון"
            className="press btn-volt flex size-11 shrink-0 items-center justify-center rounded-2xl"
          >
            <Plus className="size-5" strokeWidth={2.6} />
          </button>
        }
      />

      {/* ── Search + muscle filter ───────────────────────────── */}
      <div className="fade-up mb-4 flex flex-col gap-2.5">
        <div className="glass flex items-center gap-2 rounded-2xl px-3.5 py-2.5">
          <Search className="size-4 shrink-0 text-[var(--color-muted-foreground)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש אימון או תרגיל…"
            className="w-full bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-[var(--color-muted-foreground)]"
            aria-label="חיפוש אימונים"
          />
          {query && (
            <button onClick={() => setQuery('')} className="press text-[var(--color-muted-foreground)]" aria-label="נקה חיפוש">
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          <FilterChip active={muscle === ''} onClick={() => setMuscle('')} label="הכל" />
          {MUSCLES.map((m) => (
            <FilterChip
              key={m.id}
              active={muscle === m.id}
              onClick={() => setMuscle((cur) => (cur === m.id ? '' : m.id))}
              label={m.label}
              color={m.color}
            />
          ))}
        </div>
      </div>

      {/* ── Calendar grid (hidden while filtering) ───────────── */}
      {!filtering && (
        <GlassCard className="fade-up mb-4 p-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <button onClick={() => shiftMonth(1)} className="press glass flex size-9 items-center justify-center rounded-xl" aria-label="חודש הבא">
              <ChevronRight className="size-4" />
            </button>
            <button onClick={goToday} className="press text-sm font-bold" aria-label="חזור להיום">
              {HE_MONTHS_FULL[cursor.month]} {cursor.year}
            </button>
            <button onClick={() => shiftMonth(-1)} className="press glass flex size-9 items-center justify-center rounded-xl" aria-label="חודש קודם">
              <ChevronLeft className="size-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[var(--color-muted-foreground)]">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((key, i) => {
              if (!key) return <span key={`b${i}`} />;
              const count = countByDate.get(key) || 0;
              const isToday = key === today;
              const isSelected = key === selected;
              const day = Number(key.slice(8, 10));
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className="press relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-semibold"
                  style={{
                    background: isSelected ? 'rgba(198,242,78,0.16)' : 'transparent',
                    border: isSelected
                      ? '1px solid rgba(198,242,78,0.5)'
                      : isToday
                        ? '1px solid var(--hairline-strong)'
                        : '1px solid transparent',
                    color: isToday ? 'var(--color-volt)' : 'var(--color-card-foreground)',
                  }}
                  aria-label={`${formatDateHe(key)}${count ? ` — ${count} אימונים` : ''}`}
                  aria-pressed={isSelected}
                >
                  <span className="tnum">{day}</span>
                  {count > 0 && (
                    <span
                      className="absolute bottom-1 size-1.5 rounded-full"
                      style={{ background: 'var(--color-volt)' }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* ── Workout list (selected day or filter results) ────── */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {filtering ? `תוצאות (${listWorkouts.length})` : formatDateHe(selected)}
        </h2>
        {!filtering && (
          <button
            onClick={() => setAddOpen(true)}
            className="press flex items-center gap-1 text-sm font-semibold text-[var(--color-volt)]"
          >
            <Plus className="size-4" /> הוסף
          </button>
        )}
      </div>

      {listWorkouts.length === 0 ? (
        filtering ? (
          <EmptyState icon={Search} title="לא נמצאו אימונים" hint="נסה חיפוש אחר או סנן לפי קבוצת שריר אחרת." />
        ) : (
          <GlassCard className="flex flex-col items-center gap-3 py-8 text-center">
            <CalendarDays className="size-7 text-[var(--color-muted-foreground)]" />
            <p className="text-sm text-[var(--color-muted-foreground)]">לא רשום אימון ביום זה.</p>
            <button onClick={() => setAddOpen(true)} className="press btn-volt rounded-2xl px-4 py-2.5 text-sm font-bold">
              הוסף אימון
            </button>
          </GlassCard>
        )
      ) : (
        <WorkoutHistoryList workouts={listWorkouts} unit={unit} />
      )}

      <RetroWorkoutSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        routines={state.routines}
        initialDate={filtering ? today : selected}
        onStart={(payload) => {
          dispatch({ type: 'startWorkout', ...payload });
          setAddOpen(false);
          navigate('/workout');
        }}
      />
    </div>
  );
}

function FilterChip({ active, onClick, label, color }) {
  return (
    <button
      onClick={onClick}
      className="press flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold"
      style={{
        background: active ? 'rgba(198,242,78,0.14)' : 'var(--surface-1)',
        borderColor: active ? 'rgba(198,242,78,0.5)' : 'var(--hairline)',
        color: active ? '#f1f5f9' : 'var(--color-muted-foreground)',
      }}
      aria-pressed={active}
    >
      {color && <span className="size-1.5 rounded-full" style={{ background: color }} />}
      {label}
    </button>
  );
}
