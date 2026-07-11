import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, CalendarDays, Apple, Dumbbell, ClipboardList, TrendingUp, Plus, TimerOff } from 'lucide-react';
import { useStore } from '../store.jsx';
import { useCloud } from '../cloud.jsx';
import StartWorkoutSheet from './StartWorkoutSheet.jsx';
import { vibrate } from '../lib/utils.js';
import { canUseNutrition } from '../lib/nutritionAccess.js';

const items = [
  { to: '/', label: 'בית', icon: Home },
  { to: '/calendar', label: 'יומן', icon: CalendarDays },
  { to: '/nutrition', label: 'תזונה', icon: Apple },
  { to: '/library', label: 'תרגילים', icon: Dumbbell },
  { to: '/routines', label: 'תוכניות', icon: ClipboardList },
  { to: '/progress', label: 'התקדמות', icon: TrendingUp },
];

export default function BottomNav() {
  const { state, dispatch } = useStore();
  const { user } = useCloud();
  const navigate = useNavigate();
  const [typePicker, setTypePicker] = useState(false);
  const timerRunning = !!state.restTimer?.open;
  const visibleItems = items.filter((it) => it.to !== '/nutrition' || canUseNutrition(user));

  function startOrResume() {
    // Mid-workout, while the rest timer is running, the + turns into a stop
    // button: one tap stops the timer and closes it instead of navigating.
    if (timerRunning) {
      vibrate(12);
      dispatch({ type: 'closeRestTimer' });
      return;
    }
    vibrate(8);
    if (state.active) {
      navigate('/workout');
      return;
    }
    setTypePicker(true);
  }

  return (
    <>
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-center justify-around border-t border-[var(--hairline)] bg-[var(--surface-solid)] px-2 pb-[max(0.5rem,var(--safe-b))] pt-2 lg:hidden"
      aria-label="ניווט ראשי"
    >
      {visibleItems.slice(0, 3).map((it) => (
        <Tab key={it.to} {...it} />
      ))}

      <button
        onClick={startOrResume}
        className={`press relative -mt-7 flex size-14 shrink-0 items-center justify-center rounded-full ${timerRunning ? 'bg-rose-500 text-white shadow-[0_8px_24px_rgba(244,63,94,0.45)]' : 'btn-volt'}`}
        aria-label={timerRunning ? 'עצור טיימר' : state.active ? 'המשך אימון' : 'התחל אימון'}
      >
        {timerRunning ? (
          <TimerOff className="size-7" strokeWidth={2.6} />
        ) : (
          <Plus className="size-7" strokeWidth={2.6} />
        )}
        {state.active && !timerRunning && (
          <span className="absolute -end-0.5 -top-0.5 size-3.5 rounded-full bg-rose-500 ring-2 ring-[#07090a] pulse-glow" />
        )}
      </button>

      {visibleItems.slice(3).map((it) => (
        <Tab key={it.to} {...it} />
      ))}
    </nav>

    <StartWorkoutSheet
      open={typePicker}
      onClose={() => setTypePicker(false)}
      routines={state.routines}
      workouts={state.workouts}
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
    </>
  );
}

function Tab({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      onClick={() => vibrate(5)}
      className="press flex w-[3.25rem] flex-col items-center gap-0.5 py-1 text-[11px] font-medium"
    >
      {({ isActive }) => (
        <>
          <Icon
            className="size-[22px] transition-colors"
            style={{ color: isActive ? 'var(--color-volt)' : '#94a3b8' }}
            strokeWidth={isActive ? 2.5 : 2}
          />
          <span style={{ color: isActive ? '#f1f5f9' : '#94a3b8' }}>{label}</span>
        </>
      )}
    </NavLink>
  );
}
