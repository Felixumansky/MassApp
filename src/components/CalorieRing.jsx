import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';

export default function CalorieRing({ consumed, target }) {
  const size = 210;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const t = requestAnimationFrame(() => setOffset(circumference * (1 - pct)));
    return () => cancelAnimationFrame(t);
  }, [pct, circumference]);

  const remaining = Math.max(target - consumed, 0);
  const over = consumed > target;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="fireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          className="ring-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#fireGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <Flame className="mb-1 text-orange-400" size={26} aria-hidden="true" />
        <span className="text-4xl font-extrabold tabular-nums">{Math.round(consumed).toLocaleString()}</span>
        <span className="text-sm text-slate-400">מתוך {target.toLocaleString()} קק"ל</span>
        <span className={`mt-1 text-xs font-semibold ${over ? 'text-emerald-400' : 'text-orange-300'}`}>
          {over ? 'יעד הושג! 🎯' : `נשארו ${Math.round(remaining).toLocaleString()}`}
        </span>
      </div>
    </div>
  );
}
