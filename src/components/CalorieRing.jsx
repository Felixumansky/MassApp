import { useEffect, useRef, useState } from 'react';
import { Flame } from 'lucide-react';

function useCountUp(value, duration = 900) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
}

export default function CalorieRing({ consumed, target }) {
  const size = 224;
  const stroke = 17;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const [offset, setOffset] = useState(circumference);
  const count = useCountUp(Math.round(consumed));

  useEffect(() => {
    const t = requestAnimationFrame(() => setOffset(circumference * (1 - pct)));
    return () => cancelAnimationFrame(t);
  }, [pct, circumference]);

  const remaining = Math.max(target - consumed, 0);
  const over = consumed > target;
  const pctLabel = Math.round((target > 0 ? consumed / target : 0) * 100);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* soft glow halo behind the ring */}
      <div
        className="absolute inset-7 rounded-full opacity-55 blur-3xl"
        style={{
          background: over
            ? 'radial-gradient(circle, rgba(52,211,153,0.45), transparent 70%)'
            : 'radial-gradient(circle, rgba(244,63,94,0.42), transparent 70%)',
        }}
        aria-hidden="true"
      />
      <svg width={size} height={size} className="-rotate-90 relative" aria-hidden="true">
        <defs>
          <linearGradient id="fireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffb152" />
            <stop offset="55%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
          <linearGradient id="overGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {/* progress */}
        <circle
          className="ring-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${over ? 'overGrad' : 'fireGrad'})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <Flame
          className={`mb-1 pulse-glow ${over ? 'text-emerald-400' : 'text-orange-400'}`}
          size={26}
          aria-hidden="true"
        />
        <span className="text-[3rem] font-extrabold leading-none tabular-nums tracking-tight">
          {count.toLocaleString()}
        </span>
        <span className="mt-1.5 text-sm text-slate-400">מתוך {target.toLocaleString()} קק"ל</span>
        <span
          className={`mt-2.5 rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 ${
            over
              ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/25'
              : 'bg-orange-500/15 text-orange-300 ring-orange-400/25'
          }`}
        >
          {over ? `יעד הושג! ${pctLabel}% 🎯` : `נשארו ${Math.round(remaining).toLocaleString()}`}
        </span>
      </div>
    </div>
  );
}
