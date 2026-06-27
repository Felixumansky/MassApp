import { useMemo, useState } from 'react';
import { Search, Dumbbell } from 'lucide-react';
import { EXERCISES, MUSCLES, muscleById } from '../lib/exercises.js';
import { PageHeader, GlassCard, EmptyState } from '../components/ui.jsx';

export default function Library() {
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState('all');

  const groups = useMemo(() => {
    const needle = q.trim();
    const filtered = EXERCISES.filter((e) => {
      if (muscle !== 'all' && e.muscle !== muscle) return false;
      if (needle && !e.name.includes(needle)) return false;
      return true;
    });
    const byMuscle = {};
    for (const e of filtered) (byMuscle[e.muscle] ||= []).push(e);
    return MUSCLES.map((m) => ({ ...m, items: byMuscle[m.id] || [] })).filter((g) => g.items.length);
  }, [q, muscle]);

  return (
    <div>
      <PageHeader subtitle="ספרייה" title="תרגילים" />

      <label className="glass mb-3 flex items-center gap-2 rounded-2xl px-3 py-2.5">
        <Search className="size-4 text-[var(--color-muted-foreground)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="חיפוש תרגיל…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-muted-foreground)]"
        />
      </label>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={muscle === 'all'} onClick={() => setMuscle('all')} label="הכל" />
        {MUSCLES.map((m) => (
          <Chip key={m.id} active={muscle === m.id} onClick={() => setMuscle(m.id)} label={m.label} color={m.color} />
        ))}
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={Dumbbell} title="לא נמצאו תרגילים" hint="נסה חיפוש אחר או נקה את הסינון." />
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <section key={g.id}>
              <div className="mb-2 flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: g.color }} />
                <h2 className="text-sm font-bold" style={{ color: g.color }}>{g.label}</h2>
                <span className="text-xs text-[var(--color-muted-foreground)]">· {g.items.length}</span>
              </div>
              <ul className="grid grid-cols-2 gap-2.5">
                {g.items.map((e) => (
                  <li key={e.id}>
                    <GlassCard className="flex h-full items-center gap-2 p-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${g.color}1f` }}>
                        <Dumbbell className="size-4" style={{ color: g.color }} />
                      </span>
                      <span className="text-sm font-semibold leading-tight">{e.name}</span>
                    </GlassCard>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, label, color = '#c6f24e' }) {
  return (
    <button
      onClick={onClick}
      className="press shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold"
      style={{ background: active ? `${color}24` : 'rgba(255,255,255,0.05)', color: active ? color : '#94a3b8' }}
    >
      {label}
    </button>
  );
}
