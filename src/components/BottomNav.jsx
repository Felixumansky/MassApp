import { NavLink, useNavigate } from 'react-router-dom';
import { Home, TrendingUp, User, Plus } from 'lucide-react';

const items = [
  { to: '/', label: 'היום', Icon: Home },
  { to: '/progress', label: 'התקדמות', Icon: TrendingUp },
  { to: '/profile', label: 'פרופיל', Icon: User },
];

export default function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 mx-auto max-w-md px-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden"
      aria-label="ניווט ראשי"
    >
      <div className="glass relative flex items-center justify-around rounded-[1.9rem] px-2 py-2.5">
        {items.slice(0, 2).map(({ to, label, Icon }) => (
          <NavItem key={to} to={to} label={label} Icon={Icon} />
        ))}

        <button
          onClick={() => navigate('/add')}
          aria-label="הוספת ארוחה"
          className="btn-fire press -mt-10 flex h-16 w-16 items-center justify-center rounded-full text-white ring-4 ring-[#070912]"
        >
          <Plus size={32} strokeWidth={2.5} />
        </button>

        {items.slice(2).map(({ to, label, Icon }) => (
          <NavItem key={to} to={to} label={label} Icon={Icon} />
        ))}
      </div>
    </nav>
  );
}

function NavItem({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `press relative flex min-w-[64px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition-colors ${
          isActive ? 'text-orange-400' : 'text-slate-400 hover:text-slate-200'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute -top-0.5 h-1 w-7 rounded-full bg-gradient-to-r from-orange-400 to-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]"
              aria-hidden="true"
            />
          )}
          <Icon size={22} className={isActive ? 'drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]' : ''} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}
