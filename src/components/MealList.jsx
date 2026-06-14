import { useState } from 'react';
import { Sunrise, Sun, Moon, Cookie, Trash2, UtensilsCrossed, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MEAL_TYPES = [
  { key: 'breakfast', label: 'ארוחת בוקר', Icon: Sunrise },
  { key: 'lunch', label: 'ארוחת צהריים', Icon: Sun },
  { key: 'dinner', label: 'ארוחת ערב', Icon: Moon },
  { key: 'snack', label: 'ביניים / נשנוש', Icon: Cookie },
];

export default function MealList({ meals, onRemove, onDuplicate, addDate }) {
  const navigate = useNavigate();
  const [duplicatedId, setDuplicatedId] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);

  const duplicate = async (id) => {
    if (duplicatingId) return;
    setDuplicatingId(id);
    try {
      const succeeded = await onDuplicate(id);
      if (succeeded) {
        setDuplicatedId(id);
        setTimeout(() => setDuplicatedId(null), 1800);
      }
    } finally {
      setDuplicatingId(null);
    }
  };

  if (meals.length === 0) {
    return (
      <section className="glass fade-up flex flex-col items-center gap-3 p-8 text-center">
        <UtensilsCrossed size={36} className="text-slate-500" aria-hidden="true" />
        <p className="text-slate-300 font-medium">עוד לא נרשמו ארוחות היום</p>
        <p className="text-sm text-slate-500">כל ארוחה מקרבת אותך ליעד המסה 💪</p>
        <button
          onClick={() => navigate(`/add?date=${addDate}`)}
          className="btn-fire press mt-1 rounded-full px-6 py-2.5 font-semibold text-white"
        >
          + הוסף ארוחה ראשונה
        </button>
      </section>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
      {MEAL_TYPES.map(({ key, label, Icon }) => {
        const items = meals.filter((m) => m.meal_type === key);
        if (items.length === 0) return null;
        const totalCal = items.reduce((s, m) => s + Number(m.calories), 0);
        return (
          <section key={key} className="glass fade-up p-4" aria-label={label}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-slate-200">
                <Icon size={18} className="text-orange-400" aria-hidden="true" />
                {label}
              </h3>
              <span className="text-sm font-bold tabular-nums gradient-text">
                {Math.round(totalCal)} קק"ל
              </span>
            </div>
            <ul className="divide-y divide-white/5">
              {items.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-100">{m.food_name}</p>
                    <p className="text-xs text-slate-400 tabular-nums">
                      {m.amount ? `${Number(m.amount)} ${m.unit} · ` : ''}
                      ח {Math.round(m.protein)} · פ {Math.round(m.carbs)} · ש {Math.round(m.fat)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold tabular-nums text-slate-200">
                      {Math.round(m.calories)}
                    </span>
                    <button
                      onClick={() => duplicate(m.id)}
                      disabled={duplicatingId === m.id}
                      className="press flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-emerald-500/15 hover:text-emerald-400"
                      aria-label={`שכפול ${m.food_name} להיום`}
                    >
                      {duplicatedId === m.id ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                    <button
                      onClick={() => onRemove(m.id)}
                      className="press flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-rose-500/15 hover:text-rose-400"
                      aria-label={`מחיקת ${m.food_name}`}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
