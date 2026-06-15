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
      className="fixed bottom-0 inset-x-0 z-50 mx-auto max-w-md px-4 pb-[max(0.85rem,var(--safe-b))] lg:hidden"
      aria-label="ניווט ראשי"
    >
      <div className="glass glass-strong relative flex items-stretch rounded-[1.9rem] px-2 py-2">
        {/* right group (RTL: appears first) */}
        <div className="flex flex-1 items-center justify-evenly">
          {items.slice(0, 2).map(({ to, label, Icon }) => (
            <NavItem key={to} to={to} label={label} Icon={Icon} />
          ))}
        </div>

        {/* reserved slot keeps the floating button perfectly centered */}
        <div className="w-16 shrink-0" aria-hidden="true" />

        {/* left group */}
        <div className="flex flex-1 items-center justify-evenly">
          {items.slice(2).map(({ to, label, Icon }) => (
            <NavItem key={to} to={to} label={label} Icon={Icon} />
          ))}
        </div>

        <button
          onClick={() => navigate('/add')}
          aria-label="הוספת ארוחה"
          className="btn-fire press absolute -top-7 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-[1.55rem] text-white ring-4 ring-[#06070d]"
        >
          <Plus size={32} strokeWidth={2.5} />
        </button>
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
        `press relative flex min-h-[52px] min-w-[64px] flex-col items-center justify-center gap-1 rounded-[1.25rem] px-3 py-1.5 text-[11px] font-semibold ${
          isActive ? 'text-orange-300' : 'text-slate-400 hover:text-slate-200'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-300 ${
              isActive
                ? 'bg-gradient-to-br from-orange-500/25 to-rose-500/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                : ''
            }`}
          >
            <Icon
              size={21}
              strokeWidth={isActive ? 2.4 : 2}
              className={isActive ? 'drop-shadow-[0_0_8px_rgba(251,146,60,0.65)]' : ''}
              aria-hidden="true"
            />
          </span>
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}
