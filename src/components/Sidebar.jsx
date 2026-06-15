import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, TrendingUp, User, Plus, Dumbbell, Menu, X } from 'lucide-react';

const items = [
  { to: '/', label: 'היום', Icon: Home },
  { to: '/progress', label: 'התקדמות', Icon: TrendingUp },
  { to: '/profile', label: 'פרופיל', Icon: User },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // סגירת התפריט בעת מעבר מסך
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  // נעילת גלילת הרקע + סגירה ב-Escape בזמן שהתפריט פתוח
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      {/* כפתור המבורגר — נייד בלבד */}
      <button
        onClick={() => setOpen(true)}
        aria-label="פתיחת תפריט"
        aria-expanded={open}
        className="glass press fixed end-4 z-50 flex h-11 w-11 items-center justify-center rounded-2xl text-slate-200 lg:hidden"
        style={{ top: 'max(1rem, var(--safe-t))' }}
      >
        <Menu size={22} aria-hidden="true" />
      </button>

      {/* שכבת רקע כהה — נייד בלבד */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 start-0 z-50 flex w-64 flex-col gap-1.5 border-e border-white/10 bg-white/[0.035] p-5 backdrop-blur-2xl transition-transform duration-300 ease-out lg:translate-x-0 ${
          open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
        aria-label="ניווט ראשי"
      >
        {/* כפתור סגירה — נייד בלבד */}
        <button
          onClick={() => setOpen(false)}
          aria-label="סגירת תפריט"
          className="press absolute top-4 start-4 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-slate-200 lg:hidden"
        >
          <X size={20} aria-hidden="true" />
        </button>

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
            end={to === '/'}
            className={({ isActive }) =>
              `press relative flex items-center gap-3 rounded-2xl px-3 py-2.5 font-semibold transition-colors ${
                isActive
                  ? 'bg-gradient-to-l from-orange-500/18 to-rose-500/8 text-orange-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute inset-y-2.5 start-0 w-1 rounded-full bg-gradient-to-b from-orange-400 to-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" aria-hidden="true" />
                )}
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                    isActive ? 'bg-white/5' : ''
                  }`}
                >
                  <Icon size={19} strokeWidth={isActive ? 2.4 : 2} aria-hidden="true" />
                </span>
                {label}
              </>
            )}
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
    </>
  );
}
