import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { unitLabel, weightParts } from '../lib/utils.js';

export function VolumeChart({ data, unit }) {
  return (
    <div className="chart-frame h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<VolTip unit={unit} />} />
          <Bar dataKey="volume" radius={[6, 6, 0, 0]} maxBarSize={26}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === data.length - 1 ? 'var(--color-volt)' : 'rgba(198,242,78,0.32)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeightChart({ data, unit }) {
  return (
    <div className="chart-frame h-40">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
          <Tooltip content={<WeightTip unit={unit} />} />
          <Area type="monotone" dataKey="weight" stroke="var(--color-cyan)" strokeWidth={2.5} fill="url(#wg)" dot={{ r: 3, fill: 'var(--color-cyan)' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Estimated-1RM progression for a single exercise. `data`: [{ label, value }] in display unit. */
export function E1rmChart({ data, unit }) {
  return (
    <div className="chart-frame h-40">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="e1g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-volt)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="var(--color-volt)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
          <Tooltip content={<WeightTip unit={unit} />} />
          <Area type="monotone" dataKey="value" stroke="var(--color-volt)" strokeWidth={2.5} fill="url(#e1g)" dot={{ r: 3, fill: 'var(--color-volt)' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Weekly average RPE trend. `data`: [{ label, avgRpe, hardSets, totalSets }]. */
export function RpeChart({ data }) {
  return (
    <div className="chart-frame h-40">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="rpeg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-amber)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="var(--color-amber)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[4, 10]} ticks={[4, 6, 8, 10]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip content={<RpeTip />} />
          <Area type="monotone" dataKey="avgRpe" stroke="var(--color-amber)" strokeWidth={2.5} fill="url(#rpeg)" dot={{ r: 3, fill: 'var(--color-amber)' }} connectNulls />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function RpeTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass glass-strong rounded-xl px-3 py-2 text-xs">
      <p className="tnum font-bold">RPE ממוצע {d.avgRpe || '—'}</p>
      <p className="tnum text-[var(--color-muted-foreground)]">{d.hardSets}/{d.totalSets} סטים קשים</p>
    </div>
  );
}

/* Tooltips show both units when the datapoint carries its raw `kg` value;
   otherwise fall back to the chart's display unit. */
function VolTip({ active, payload, unit }) {
  if (!active || !payload?.length) return null;
  const kg = payload[0].payload.kg;
  if (kg == null) {
    return (
      <div className="glass glass-strong rounded-xl px-3 py-2 text-xs">
        <p className="tnum font-bold">{payload[0].value.toLocaleString()} {unitLabel(unit)}</p>
      </div>
    );
  }
  const p = weightParts(kg);
  const primaryKg = unit !== 'lb';
  return (
    <div className="glass glass-strong rounded-xl px-3 py-2 text-xs">
      <p className="tnum font-bold">{primaryKg ? `${p.kg.toLocaleString()} ק״ג` : `${p.lb.toLocaleString()} lb`}</p>
      <p className="tnum text-[var(--color-muted-foreground)]">{primaryKg ? `${p.lb.toLocaleString()} lb` : `${p.kg.toLocaleString()} ק״ג`}</p>
    </div>
  );
}

function WeightTip({ active, payload, unit }) {
  if (!active || !payload?.length) return null;
  const kg = payload[0].payload.kg;
  if (kg == null) {
    return (
      <div className="glass glass-strong rounded-xl px-3 py-2 text-xs">
        <p className="tnum font-bold">{payload[0].value} {unitLabel(unit)}</p>
      </div>
    );
  }
  const p = weightParts(kg);
  const primaryKg = unit !== 'lb';
  return (
    <div className="glass glass-strong rounded-xl px-3 py-2 text-xs">
      <p className="tnum font-bold">{primaryKg ? `${p.kg} ק״ג` : `${p.lb} lb`}</p>
      <p className="tnum text-[var(--color-muted-foreground)]">{primaryKg ? `${p.lb} lb` : `${p.kg} ק״ג`}</p>
    </div>
  );
}
