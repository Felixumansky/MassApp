import { Droplets, GlassWater, Milk, Trash2 } from 'lucide-react';

const QUICK = [
  { label: 'כוס', ml: 250, Icon: GlassWater },
  { label: 'בקבוק קטן', ml: 500, Icon: Milk },
  { label: 'בקבוק גדול', ml: 750, Icon: Droplets },
];

export default function WaterTracker({ totalMl, targetMl, logs, onAdd, onRemove }) {
  const pct = targetMl > 0 ? Math.min((totalMl / targetMl) * 100, 100) : 0;
  const liters = (totalMl / 1000).toFixed(2).replace(/\.?0+$/, '');
  const targetLiters = (targetMl / 1000).toFixed(1);

  return (
    <section className="glass fade-up p-5" aria-label="מעקב מים">
      <div className="flex items-center gap-4">
        {/* בקבוק מתמלא */}
        <div className="relative h-28 w-14 shrink-0 overflow-hidden rounded-[1.1rem] border border-sky-300/20 bg-white/5 shadow-[inset_0_1px_4px_rgba(0,0,0,0.45)]">
          <div
            className="water-fill absolute inset-x-0 bottom-0 bg-gradient-to-t from-sky-500 via-sky-400 to-sky-300/80 shadow-[0_0_18px_rgba(56,189,248,0.55)]"
            style={{ height: `${pct}%` }}
          >
            <span className="absolute inset-x-0 top-0 h-1.5 bg-white/30 blur-[1px]" aria-hidden="true" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <Droplets size={20} className="text-white/85 drop-shadow" aria-hidden="true" />
            <span className="text-[11px] font-bold tabular-nums text-white/90">{Math.round(pct)}%</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <h2 className="font-bold text-sky-300">מים</h2>
            <span className="text-sm text-slate-400 tabular-nums">
              <b className="text-2xl text-slate-50">{liters}</b> / {targetLiters} ליטר
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {QUICK.map(({ label, ml, Icon }) => (
              <button
                key={ml}
                onClick={() => onAdd(ml)}
                className="press flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl border border-sky-300/20 bg-sky-400/10 py-2 text-sky-200 hover:bg-sky-400/20"
                aria-label={`הוספת ${ml} מ"ל מים`}
              >
                <Icon size={19} aria-hidden="true" />
                <span className="text-[11px] font-semibold">{ml} מ"ל</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {logs.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {logs.map((log) => (
            <li key={log.id}>
              <button
                onClick={() => onRemove(log.id)}
                className="press flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-rose-500/20 hover:text-rose-300"
                aria-label={`מחיקת רישום ${log.amount_ml} מ"ל`}
              >
                <span className="tabular-nums">{log.amount_ml} מ"ל</span>
                <Trash2 size={12} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
