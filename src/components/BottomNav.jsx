import { NavLink, useNavigate } from 'react-router-dom';
import { Home, CalendarDays, Dumbbell, ClipboardList, TrendingUp, Plus } from 'lucide-react';
import { useStore } from '../store.jsx';
import { vibrate } from '../lib/utils.js';

const items = [
  { to: '/', label: 'בית', icon: Home },
  { to: '/calendar', label: 'יומן', icon: CalendarDays },
  { to: '/library', label: 'תרגילים', icon: Dumbbell },
  { to: '/routines', label: 'תוכניות', icon: ClipboardList },
  { to: '/progress', label: 'התקדמות', icon: TrendingUp },
];

export default function BottomNav() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  function startOrResume() {
    vibrate(8);
    if (!state.active) dispatch({ type: 'startWorkout' });
    navigate('/workout');
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-center justify-around border-t border-[var(--hairline)] bg-[var(--surface-solid)] px-2 pb-[max(0.5rem,var(--safe-b))] pt-2 lg:hidden"
      aria-label="ניווט ראשי"
    >
      {items.slice(0, 2).map((it) => (
        <Tab key={it.to} {...it} />
      ))}

      <button
        onClick={startOrResume}
        className="btn-volt press relative -mt-7 flex size-14 shrink-0 items-center justify-center rounded-full"
        aria-label={state.active ? 'המשך אימון' : 'התחל אימון'}
      >
        <Plus className="size-7" strokeWidth={2.6} />
        {state.active && (
          <span className="absolute -end-0.5 -top-0.5 size-3.5 rounded-full bg-rose-500 ring-2 ring-[#07090a] pulse-glow" />
        )}
      </button>

      {items.slice(2).map((it) => (
        <Tab key={it.to} {...it} />
      ))}
    </nav>
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
