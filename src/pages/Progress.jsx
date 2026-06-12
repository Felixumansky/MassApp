import { useCallback, useEffect, useState } from 'react';
import { api, todayStr } from '../api.js';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import { Scale, TrendingUp, Plus } from 'lucide-react';

const dayLabel = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('he-IL', { weekday: 'short' });

export default function Progress() {
  const [weights, setWeights] = useState([]);
  const [history, setHistory] = useState([]);
  const [target, setTarget] = useState(null);
  const [goalWeight, setGoalWeight] = useState(null);
  const [newWeight, setNewWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [w, h, p] = await Promise.all([api.weights.list(), api.history(7), api.profile.get()]);
      setWeights(w.map((row) => ({ ...row, weight: Number(row.weight) })));
      setHistory(h.map((row) => ({ ...row, day: dayLabel(row.date) })));
      setTarget(p.calorie_target);
      setGoalWeight(p.goal_weight ? Number(p.goal_weight) : null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addWeight = async () => {
    if (!Number(newWeight) || saving) return;
    setSaving(true);
    try {
      await api.weights.create({ date: todayStr(), weight: Number(newWeight) });
      setNewWeight('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const first = weights[0]?.weight;
  const last = weights[weights.length - 1]?.weight;
  const gained = first != null && last != null ? Math.round((last - first) * 10) / 10 : null;

  return (
    <div className="space-y-4">
      <header className="fade-up">
        <h1 className="text-2xl font-extrabold">
          <span className="gradient-text">התקדמות</span> 📈
        </h1>
        <p className="text-sm text-slate-400">המסה לא נבנית ביום אחד — אבל היא נבנית כל יום</p>
      </header>

      {error && <p className="fade-up rounded-2xl bg-rose-500/15 p-3 text-sm text-rose-300">{error}</p>}

      {/* הוספת שקילה */}
      <section className="glass fade-up p-4" aria-label="שקילה חדשה">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-200">
          <Scale size={18} className="text-orange-400" aria-hidden="true" /> שקילה של היום
        </h2>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="1"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            placeholder='משקל בק"ג'
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-center text-xl font-bold tabular-nums text-slate-100 placeholder:text-sm placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400/60"
            aria-label="משקל בקילוגרם"
          />
          <button
            onClick={addWeight}
            disabled={!Number(newWeight) || saving}
            className="btn-fire press flex min-w-[56px] items-center justify-center rounded-2xl px-4 text-white disabled:opacity-40 disabled:shadow-none"
            aria-label="שמירת שקילה"
          >
            <Plus size={24} />
          </button>
        </div>
        {gained != null && weights.length > 1 && (
          <p className="mt-3 text-center text-sm text-slate-300">
            מאז ההתחלה:{' '}
            <b className={gained >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {gained >= 0 ? '+' : ''}{gained} ק"ג
            </b>
            {goalWeight && last != null && (
              <span className="text-slate-400"> · עוד {Math.max(Math.round((goalWeight - last) * 10) / 10, 0)} ק"ג ליעד</span>
            )}
          </p>
        )}
      </section>

      {/* גרפים - זה לצד זה בדסקטופ */}
      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
      <section className="glass fade-up p-4" aria-label="גרף משקל">
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-slate-200">
          <TrendingUp size={18} className="text-emerald-400" aria-hidden="true" /> מסלול המשקל
        </h2>
        {weights.length < 2 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            הוסף לפחות שתי שקילות כדי לראות את הגרף 📊
          </p>
        ) : (
          <div className="h-48 lg:h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weights} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(d) => new Date(`${d}T12:00:00`).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#161b2c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f1f5f9' }}
                  formatter={(v) => [`${v} ק"ג`, 'משקל']}
                  labelFormatter={(d) => new Date(`${d}T12:00:00`).toLocaleDateString('he-IL')}
                />
                {goalWeight && <ReferenceLine y={goalWeight} stroke="#fb923c" strokeDasharray="6 4" />}
                <Area type="monotone" dataKey="weight" stroke="#34d399" strokeWidth={2.5} fill="url(#weightGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* גרף קלוריות שבועי */}
      <section className="glass fade-up p-4" aria-label="גרף קלוריות שבועי">
        <h2 className="mb-2 font-semibold text-slate-200">🔥 קלוריות — 7 ימים אחרונים</h2>
        <div className="h-44 lg:h-72" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={history} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{ background: '#161b2c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f1f5f9' }}
                formatter={(v) => [`${Math.round(v)} קק"ל`, 'קלוריות']}
              />
              {target && <ReferenceLine y={target} stroke="#fb923c" strokeDasharray="6 4" label={{ value: 'יעד', fill: '#fb923c', fontSize: 11, position: 'insideTopRight' }} />}
              <Bar dataKey="calories" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      </div>
    </div>
  );
}
