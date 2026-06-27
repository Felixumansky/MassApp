import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, ClipboardList, TrendingUp, User, Zap, Play } from 'lucide-react';
import { useStore } from '../store.jsx';

const links = [
  { to: '/', label: 'בית', icon: Home },
  { to: '/library', label: 'תרגילים', icon: Dumbbell },
  { to: '/routines', label: 'תוכניות', icon: ClipboardList },
  { to: '/progress', label: 'התקדמות', icon: TrendingUp },
  { to: '/profile', label: 'פרופיל', icon: User },
];

/** Desktop-only fixed sidebar (lg+). */
export default function Sidebar() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 p-6 lg:flex">
      <div className="flex items-center gap-2.5 px-2">
        <span className="btn-volt flex size-10 items-center justify-center rounded-2xl">
          <Zap className="size-5" strokeWidth={2.6} />
        </span>
        <span className="text-xl font-extrabold tracking-tight">LiftLog</span>
      </div>

      <nav className="flex flex-col gap-1" aria-label="ניווט ראשי">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="press flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold"
            style={({ isActive }) => ({
              background: isActive ? 'rgba(198,242,78,0.12)' : 'transparent',
              color: isActive ? '#f1f5f9' : '#94a3b8',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon className="size-5" style={{ color: isActive ? 'var(--color-volt)' : '#94a3b8' }} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => {
          if (!state.active) dispatch({ type: 'startWorkout' });
          navigate('/workout');
        }}
        className="btn-volt press mt-auto flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold"
      >
        <Play className="size-4" fill="currentColor" />
        {state.active ? 'המשך אימון' : 'התחל אימון'}
      </button>
    </aside>
  );
}
