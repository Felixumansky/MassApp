export default function MacroBar({ label, value, target, color }) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const done = pct >= 100;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="font-semibold text-slate-200">{label}</span>
        <span className="tabular-nums text-slate-400">
          <b className="text-slate-50">{Math.round(value)}</b> / {target} גרם
          <span
            className={`ms-2 inline-block min-w-[2.5rem] rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold ${
              done ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-slate-400'
            }`}
          >
            {Math.round(pct)}%
          </span>
        </span>
      </div>
      <div
        className="relative h-3.5 overflow-hidden rounded-full bg-white/[0.06] shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(value)}
        aria-valuemax={target}
      >
        <div
          className="relative h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: color,
            boxShadow: done ? '0 0 14px -1px currentColor' : 'none',
          }}
        >
          {/* moving sheen along the fill */}
          <span
            className="absolute inset-0 rounded-full opacity-70"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
              backgroundSize: '200% 100%',
              animation: 'barShimmer 2.4s linear infinite',
            }}
          />
        </div>
      </div>
    </div>
  );
}
