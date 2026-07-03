import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Dumbbell, Play, ChevronLeft, Layers, User, CalendarClock } from 'lucide-react';
import { useStore } from '../store.jsx';
import { useCloud } from '../cloud.jsx';
import { PageHeader, GlassCard } from '../components/ui.jsx';
import WorkoutHistoryList from '../components/WorkoutHistory.jsx';
import RetroWorkoutSheet from '../components/RetroWorkoutSheet.jsx';
import StartWorkoutSheet from '../components/StartWorkoutSheet.jsx';
import { workoutVolume, dayKey, fmtWeight, unitLabel } from '../lib/utils.js';

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return 'לילה טוב';
  if (h < 12) return 'בוקר טוב';
  if (h < 18) return 'צהריים טובים';
  return 'ערב טוב';
}

/** Count consecutive days back from today with at least one workout. */
function computeStreak(workouts) {
  const days = new Set(workouts.map((w) => w.date));
  let streak = 0;
  const d = new Date();
  // allow today to be empty (streak continues from yesterday)
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export default function Dashboard() {
  const { state, dispatch } = useStore();
  const { user } = useCloud();
  const navigate = useNavigate();
  const { workouts, profile, active } = state;
  const unit = profile.unit || 'kg';

  const stats = useMemo(() => {
    const weekAgo = dayKey(new Date(Date.now() - 6 * 864e5));
    const thisWeek = workouts.filter((w) => w.date >= weekAgo);
    return {
      weekCount: thisWeek.length,
      weekVolume: thisWeek.reduce((s, w) => s + workoutVolume(w), 0),
      streak: computeStreak(workouts),
    };
  }, [workouts]);

  const recent = workouts.slice(0, 4);
  const [typePicker, setTypePicker] = useState(false);

  function start() {
    if (active) {
      navigate('/workout');
      return;
    }
    setTypePicker(true);
  }

  return (
    <div>
      <PageHeader
        subtitle={profile.name ? `${greeting()}, ${profile.name}` : greeting()}
        title="מוכן לאימון?"
        action={
          <button
            onClick={() => navigate('/profile')}
            aria-label={user ? 'פרופיל — מחובר/ת' : 'פרופיל'}
            className="press glass relative flex size-11 shrink-0 items-center justify-center rounded-2xl lg:hidden"
          >
            <User className="size-5 text-[var(--color-muted-foreground)]" />
            {user && (
              <span
                className="absolute -end-0.5 -top-0.5 size-3 rounded-full bg-[var(--color-volt)] ring-2 ring-[#07090a]"
                aria-hidden="true"
              />
            )}
          </button>
        }
      />

      {active ? (
        <button onClick={() => navigate('/workout')} className="press fade-up mb-4 w-full text-start">
          <GlassCard strong glow className="flex items-center gap-3">
            <span className="btn-volt flex size-11 items-center justify-center rounded-2xl">
              <Play className="size-5" fill="currentColor" />
            </span>
            <div className="flex-1">
              <p className="font-bold">אימון פעיל — {active.name}</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {active.exercises.length} תרגילים · המשך מהמקום שעצרת
              </p>
            </div>
            <ChevronLeft className="size-5 text-[var(--color-muted-foreground)]" />
          </GlassCard>
        </button>
      ) : (
        <div className="fade-up mb-4 flex flex-col gap-2">
          <button onClick={start} className="press w-full">
            <div className="btn-volt flex items-center justify-center gap-2 rounded-[var(--r-lg)] py-4 text-base font-extrabold">
              <Play className="size-5" fill="currentColor" />
              התחל אימון חדש
            </div>
          </button>
          <RetroWorkoutButton
            routines={state.routines}
            onStart={(payload) => {
              dispatch({ type: 'startWorkout', ...payload });
              navigate('/workout');
            }}
          />
        </div>
      )}

      <section className="mb-5 grid grid-cols-3 gap-3" style={{ '--d': '0.05s' }}>
        <Stat icon={Dumbbell} color="var(--color-volt)" value={`${stats.weekCount}/${profile.weeklyGoal}`} label="השבוע" />
        <Stat icon={Layers} color="var(--color-cyan)" value={fmtWeight(stats.weekVolume, unit).toLocaleString()} label={`${unitLabel(unit)} נפח`} />
        <Stat icon={Flame} color="var(--color-amber)" value={stats.streak} label="רצף ימים" />
      </section>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">אימונים אחרונים</h2>
        <button onClick={() => navigate('/progress')} className="press text-sm font-semibold text-[var(--color-volt)]">
          הצג הכל
        </button>
      </div>

      {recent.length === 0 ? (
        <GlassCard className="text-center text-sm text-[var(--color-muted-foreground)]">
          עדיין אין אימונים. לחץ על «התחל אימון» כדי להתחיל.
        </GlassCard>
      ) : (
        <WorkoutHistoryList workouts={recent} unit={unit} />
      )}

      <StartWorkoutSheet
        open={typePicker}
        onClose={() => setTypePicker(false)}
        routines={state.routines}
        workouts={workouts}
        customExercises={state.customExercises}
        onPick={(routine) => {
          setTypePicker(false);
          dispatch({ type: 'startWorkout', ...(routine ? { routine } : {}) });
          navigate('/workout');
        }}
        onCreateRoutine={() => {
          setTypePicker(false);
          navigate('/routines');
        }}
      />
    </div>
  );
}

function RetroWorkoutButton({ routines, onStart }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="press glass flex w-full items-center justify-center gap-2 rounded-[var(--r-lg)] py-3 text-sm font-bold"
      >
        <CalendarClock className="size-4 text-[var(--color-cyan)]" />
        רשום אימון קודם
      </button>

      <RetroWorkoutSheet
        open={open}
        onClose={() => setOpen(false)}
        routines={routines}
        onStart={(payload) => {
          onStart(payload);
          setOpen(false);
        }}
      />
    </>
  );
}
function Stat({ icon: Icon, color, value, label }) {
  return (
    <GlassCard className="flex flex-col items-center gap-1 px-2 py-3.5 text-center">
      <Icon className="size-5" style={{ color }} />
      <span className="tnum text-xl font-extrabold leading-none">{value}</span>
      <span className="text-[11px] font-medium text-[var(--color-muted-foreground)]">{label}</span>
    </GlassCard>
  );
}
