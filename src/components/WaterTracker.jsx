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
        <div className="relative h-28 w-14 shrink-0 overflow-hidden rounded-2xl border border-sky-300/20 bg-white/5">
          <div
            className="water-fill absolute bottom-0 inset-x-0 bg-gradient-to-t from-sky-500 to-sky-300/80"
            style={{ height: `${pct}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Droplets size={22} className="text-white/80" aria-hidden="true" />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold text-sky-300">מים</h2>
            <span className="text-sm text-slate-400 tabular-nums">
              <b className="text-xl text-slate-100">{liters}</b> / {targetLiters} ליטר
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {QUICK.map(({ label, ml, Icon }) => (
              <button
                key={ml}
                onClick={() => onAdd(ml)}
                className="press flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl border border-sky-300/20 bg-sky-400/10 py-2 text-sky-200 hover:bg-sky-400/20"
                aria-label={`הוספת ${ml} מ"ל מים`}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="text-[11px] font-medium">{ml} מ"ל</span>
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
