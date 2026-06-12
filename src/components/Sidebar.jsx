import { NavLink, useNavigate } from 'react-router-dom';
import { Home, TrendingUp, User, Plus, Dumbbell } from 'lucide-react';

const items = [
  { to: '/', label: 'היום', Icon: Home },
  { to: '/progress', label: 'התקדמות', Icon: TrendingUp },
  { to: '/profile', label: 'פרופיל', Icon: User },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside
      className="fixed inset-y-0 start-0 z-50 hidden w-64 flex-col gap-2 border-e border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl lg:flex"
      aria-label="ניווט ראשי"
    >
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="btn-fire flex h-11 w-11 items-center justify-center rounded-2xl text-white">
          <Dumbbell size={24} aria-hidden="true" />
        </div>
        <div>
          <span className="text-xl font-extrabold gradient-text">MassApp</span>
          <p className="text-xs text-slate-500">עלייה למסה</p>
        </div>
      </div>

      {items.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `press flex items-center gap-3 rounded-2xl px-4 py-3 font-medium transition-colors ${
              isActive
                ? 'bg-orange-500/15 text-orange-300'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`
          }
        >
          <Icon size={20} aria-hidden="true" />
          {label}
        </NavLink>
      ))}

      <button
        onClick={() => navigate('/add')}
        className="btn-fire press mt-4 flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white"
      >
        <Plus size={20} aria-hidden="true" /> הוספת ארוחה
      </button>

      <p className="mt-auto px-2 text-center text-xs text-slate-600">
        כל ארוחה מקרבת אותך ליעד 💪
      </p>
    </aside>
  );
}
