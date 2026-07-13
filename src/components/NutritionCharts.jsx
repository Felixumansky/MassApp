import { useMemo, useState } from 'react';
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
  PieChart,
  Pie,
  ReferenceLine,
} from 'recharts';
import { GlassCard } from './ui.jsx';
import { dayKey, shortDateHe, vibrate } from '../lib/utils.js';
import {
  caloriesByDay,
  macroDistribution,
  mealTypeDistribution,
  goalAdherence,
} from '../lib/nutritionAnalytics.js';

/* גרפי תזונה — עוקבים אחרי המוסכמות של ProgressCharts (chart-frame, צירים
   מושתקים, tooltips זכוכית). זהות אף פעם לא בצבע בלבד: לדונאט יש מקרא עם
   תוויות וערכים, ולעמודות ציר קטגוריות מפורש. ציר y יחיד בכל גרף. */

const CAL_COLOR = '#F97316';

function rangeStart(days) {
  return dayKey(new Date(Date.now() - (days - 1) * 864e5));
}

export default function NutritionCharts({ meals, goals }) {
  const [range, setRange] = useState(7); // 7 | 30

  const start = rangeStart(range);
  const end = dayKey();

  const weekSeries = useMemo(() => caloriesByDay(meals, 7), [meals]);
  const trendSeries = useMemo(
    () =>
      caloriesByDay(meals, 30).map((d) => ({
        ...d,
        label: shortDateHe(d.date),
      })),
    [meals]
  );
  const macros = useMemo(() => macroDistribution(meals, start, end), [meals, start, end]);
  const byType = useMemo(() => mealTypeDistribution(meals, start, end), [meals, start, end]);
  const adherence = useMemo(() => goalAdherence(meals, goals, range), [meals, goals, range]);

  const hasData = macros.some((m) => m.grams > 0);

  return (
    <div className="flex flex-col gap-4">
      {/* בורר טווח — משפיע על ההתפלגויות והמדדים */}
      <div className="flex justify-center gap-1.5" role="radiogroup" aria-label="טווח זמן">
        {[
          { days: 7, label: 'שבוע' },
          { days: 30, label: 'חודש' },
        ].map((o) => (
          <button
            key={o.days}
            onClick={() => { vibrate(5); setRange(o.days); }}
            role="radio"
            aria-checked={range === o.days}
            className="press rounded-xl px-4 py-2 text-xs font-bold"
            style={{
              background: range === o.days ? 'rgba(249,115,22,0.18)' : 'rgba(255,255,255,0.04)',
              color: range === o.days ? '#fdba74' : '#94a3b8',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* מדדי עמידה ביעד */}
      <section className="grid grid-cols-3 gap-3">
        <StatTile value={adherence.avgCalories || '—'} label="ממוצע קק״ל ליום" />
        <StatTile value={`${adherence.hitDays}/${adherence.trackedDays}`} label="ימים בטווח היעד" />
        <StatTile value={adherence.trackedDays} label="ימים עם רישום" />
      </section>

      {/* התפלגות מאקרו — דונאט + מקרא ערכים */}
      <GlassCard>
        <h2 className="mb-3 font-bold">התפלגות מאקרו</h2>
        {!hasData ? (
          <p className="py-6 text-center text-sm text-[var(--color-muted-foreground)]">
            אין נתונים בטווח — הוסיפו ארוחות כדי לראות התפלגות.
          </p>
        ) : (
          <div className="flex items-center gap-4">
            {/* לא chart-frame — הוא כופה width:100% ודוחס את המקרא החוצה */}
            <div className="h-36 w-36 shrink-0 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macros}
                    dataKey="kcal"
                    nameKey="label"
                    innerRadius="62%"
                    outerRadius="100%"
                    paddingAngle={3}
                    stroke="transparent"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {macros.map((m) => (
                      <Cell key={m.id} fill={m.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex min-w-0 flex-1 flex-col gap-2.5">
              {macros.map((m) => (
                <li key={m.id} className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: m.color }} />
                  <div className="min-w-0">
                    <span className="block text-sm font-bold leading-tight">{m.label}</span>
                    <span className="tnum block whitespace-nowrap text-xs font-semibold leading-tight text-[var(--color-muted-foreground)]">
                      {m.grams} גר׳ · {m.pct}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </GlassCard>

      {/* קלוריות שבועיות מול יעד */}
      <GlassCard>
        <h2 className="mb-1 font-bold">7 ימים אחרונים מול היעד</h2>
        <p className="mb-3 text-[11px] font-semibold text-[var(--color-muted-foreground)]">
          קו מקווקו = יעד יומי ({goals.calories} קק״ל)
        </p>
        <div className="chart-frame h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weekSeries.map((d) => ({ ...d, label: shortDateHe(d.date) }))}
              margin={{ top: 6, right: 4, left: -14, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<CalTip />} />
              <ReferenceLine
                y={goals.calories}
                stroke="rgba(255,255,255,0.35)"
                strokeDasharray="6 4"
              />
              <Bar dataKey="calories" radius={[6, 6, 0, 0]} maxBarSize={26}>
                {weekSeries.map((d, i) => (
                  <Cell
                    key={d.date}
                    fill={i === weekSeries.length - 1 ? CAL_COLOR : 'rgba(249,115,22,0.35)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* מגמת 30 יום */}
      <GlassCard>
        <h2 className="mb-3 font-bold">מגמת קלוריות — 30 יום</h2>
        <div className="chart-frame h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendSeries} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="calTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CAL_COLOR} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={CAL_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} interval={6} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<CalTip />} />
              <Area
                type="monotone"
                dataKey="calories"
                stroke={CAL_COLOR}
                strokeWidth={2}
                fill="url(#calTrend)"
                dot={false}
                activeDot={{ r: 4, fill: CAL_COLOR }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* התפלגות לפי סוג ארוחה */}
      <GlassCard>
        <h2 className="mb-3 font-bold">מאיפה מגיעות הקלוריות?</h2>
        <ul className="flex flex-col gap-2.5">
          {byType.map((t) => (
            <li key={t.id}>
              <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                <span>{t.emoji} {t.label}</span>
                <span className="tnum text-[var(--color-muted-foreground)]">
                  {t.kcal.toLocaleString()} קק״ל · {t.pct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${t.pct}%`, background: 'rgba(249,115,22,0.75)' }}
                />
              </div>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}

function StatTile({ value, label }) {
  return (
    <GlassCard className="flex flex-col items-center gap-1 px-2 py-3.5 text-center">
      <span className="tnum text-xl font-extrabold leading-none">{value}</span>
      <span className="text-[11px] font-medium text-[var(--color-muted-foreground)]">{label}</span>
    </GlassCard>
  );
}

function CalTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass glass-strong rounded-xl px-3 py-2 text-xs">
      <p className="tnum font-bold">{d.calories.toLocaleString()} קק״ל</p>
      <p className="tnum text-[var(--color-muted-foreground)]">
        🟣 {d.protein} · 🟡 {d.carbs} · 🟢 {d.fat} גר׳
      </p>
    </div>
  );
}
