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
import { unitLabel } from '../lib/utils.js';

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

function VolTip({ active, payload, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass glass-strong rounded-xl px-3 py-2 text-xs">
      <p className="tnum font-bold">{payload[0].value.toLocaleString()} {unitLabel(unit)}</p>
    </div>
  );
}

function WeightTip({ active, payload, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass glass-strong rounded-xl px-3 py-2 text-xs">
      <p className="tnum font-bold">{payload[0].value} {unitLabel(unit)}</p>
    </div>
  );
}
