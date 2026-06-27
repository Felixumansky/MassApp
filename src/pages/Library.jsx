import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Dumbbell, Plus, X, Trash2 } from 'lucide-react';
import { EXERCISES, MUSCLES, muscleById } from '../lib/exercises.js';
import { useStore } from '../store.jsx';
import { PageHeader, GlassCard, EmptyState } from '../components/ui.jsx';
import { vibrate } from '../lib/utils.js';

export default function Library() {
  const { state, dispatch } = useStore();
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState('all');
  const [creating, setCreating] = useState(false);

  const custom = state.customExercises || [];

  const groups = useMemo(() => {
    const needle = q.trim();
    const all = [...EXERCISES, ...custom];
    const filtered = all.filter((e) => {
      if (muscle !== 'all' && e.muscle !== muscle) return false;
      if (needle && !e.name.includes(needle)) return false;
      return true;
    });
    const byMuscle = {};
    for (const e of filtered) (byMuscle[e.muscle] ||= []).push(e);
    return MUSCLES.map((m) => ({ ...m, items: byMuscle[m.id] || [] })).filter((g) => g.items.length);
  }, [q, muscle, custom]);

  return (
    <div>
      <PageHeader
        subtitle="ספרייה"
        title="תרגילים"
        action={
          <button
            onClick={() => setCreating(true)}
            className="btn-volt press flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-bold"
          >
            <Plus className="size-4" /> תרגיל
          </button>
        }
      />

      <label className="glass mb-3 flex items-center gap-2 rounded-xl px-3 py-2.5">
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
        <EmptyState icon={Dumbbell} title="לא נמצאו תרגילים" hint="נסה חיפוש אחר, נקה את הסינון, או הוסף תרגיל חדש." />
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
                      <span className="flex-1 text-sm font-semibold leading-tight">{e.name}</span>
                      {e.custom && (
                        <button
                          onClick={() => {
                            if (!confirm(`למחוק את "${e.name}" מהספרייה?`)) return;
                            vibrate(8);
                            dispatch({ type: 'deleteCustomExercise', id: e.id });
                          }}
                          className="press shrink-0 text-[var(--color-muted-foreground)]"
                          aria-label="מחק תרגיל מותאם"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </GlassCard>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <CreateExercise
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(name, m) => { dispatch({ type: 'addCustomExercise', name, muscle: m }); setCreating(false); }}
      />
    </div>
  );
}

function CreateExercise({ open, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState(MUSCLES[0].id);

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    vibrate(10);
    onCreate(name, muscle);
    setName('');
    setMuscle(MUSCLES[0].id);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.form
            onSubmit={submit}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="solid shadow-[var(--shadow-overlay)] fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md flex-col rounded-t-2xl p-4 pb-[max(1rem,var(--safe-b))]"
            role="dialog" aria-modal="true" aria-label="תרגיל חדש"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">תרגיל חדש</h2>
              <button type="button" onClick={onClose} className="press glass flex size-9 items-center justify-center rounded-xl" aria-label="סגור">
                <X className="size-4" />
              </button>
            </div>

            <input
              autoFocus value={name} onChange={(e) => setName(e.target.value)}
              placeholder="שם התרגיל (למשל: לחיצת חזה בשיפוע)"
              className="glass mb-3 w-full rounded-xl px-4 py-3 text-sm font-semibold outline-none placeholder:font-normal placeholder:text-[var(--color-muted-foreground)]"
            />

            <p className="mb-2 text-xs font-semibold text-[var(--color-muted-foreground)]">קבוצת שריר</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {MUSCLES.map((m) => (
                <button
                  key={m.id} type="button" onClick={() => setMuscle(m.id)}
                  className="press rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: muscle === m.id ? `${m.color}24` : 'rgba(255,255,255,0.05)',
                    color: muscle === m.id ? m.color : '#94a3b8',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <button type="submit" disabled={!name.trim()} className="btn-volt press rounded-xl py-3.5 text-sm font-bold disabled:opacity-40">
              הוסף למאגר
            </button>
          </motion.form>
        </>
      )}
    </AnimatePresence>
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
