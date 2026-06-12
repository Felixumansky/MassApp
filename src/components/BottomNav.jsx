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
      className="fixed bottom-0 inset-x-0 z-50 mx-auto max-w-md lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="ניווט ראשי"
    >
      <div className="glass !rounded-b-none !rounded-t-3xl flex items-center justify-around px-2 py-2 relative">
        {items.slice(0, 2).map(({ to, label, Icon }) => (
          <NavItem key={to} to={to} label={label} Icon={Icon} />
        ))}

        <button
          onClick={() => navigate('/add')}
          aria-label="הוספת ארוחה"
          className="btn-fire press -mt-9 flex h-16 w-16 items-center justify-center rounded-full text-white"
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
      className={({ isActive }) =>
        `press flex min-w-[64px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition-colors ${
          isActive ? 'text-orange-400' : 'text-slate-400'
        }`
      }
    >
      <Icon size={22} />
      <span>{label}</span>
    </NavLink>
  );
}
