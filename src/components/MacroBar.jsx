export default function MacroBar({ label, value, target, color }) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium text-slate-300">{label}</span>
        <span className="tabular-nums text-slate-400">
          <b className="text-slate-100">{Math.round(value)}</b> / {target} גרם
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/8" role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemax={target}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
