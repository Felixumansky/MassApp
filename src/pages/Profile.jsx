import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { biometricSupported } from '../lib/biometric.js';
import {
  User,
  Target,
  Trash2,
  Zap,
  Cloud,
  CloudOff,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Fingerprint,
  Download,
  Upload,
  MapPin,
  LocateFixed,
  RadioTower,
} from 'lucide-react';
import { seed, useStore } from '../store.jsx';
import { useCloud } from '../cloud.jsx';
import { PageHeader, GlassCard } from '../components/ui.jsx';
import { vibrate } from '../lib/utils.js';
import { hasGymLocation } from '../lib/gymAutoStart.js';

function syncedSlice(data) {
  return {
    profile: data.profile || seed().profile,
    workouts: data.workouts || [],
    routines: data.routines || [],
    bodyWeights: data.bodyWeights || [],
    customExercises: data.customExercises || [],
  };
}

export default function Profile() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const { profile, workouts } = state;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        subtitle="הגדרות"
        title="פרופיל"
        action={
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            aria-label="חזור"
            className="press glass flex size-11 shrink-0 items-center justify-center rounded-2xl lg:hidden"
          >
            <ChevronRight className="size-5" />
          </button>
        }
      />

      <GlassCard className="flex items-center gap-4">
        <span className="btn-volt flex size-14 items-center justify-center rounded-3xl">
          <Zap className="size-7" strokeWidth={2.4} />
        </span>
        <div>
          <p className="text-lg font-extrabold">{profile.name || 'מתאמן/ת'}</p>
          <p className="tnum text-sm text-[var(--color-muted-foreground)]">{workouts.length} אימונים תועדו</p>
        </div>
      </GlassCard>

      <GlassCard className="flex flex-col gap-4">
        <Field icon={User} label="שם">
          <input
            value={profile.name}
            onChange={(e) => dispatch({ type: 'profile', patch: { name: e.target.value } })}
            placeholder="הזן שם"
            className="w-full bg-transparent text-end font-semibold outline-none placeholder:font-normal placeholder:text-[var(--color-muted-foreground)]"
          />
        </Field>

        <div className="h-px bg-white/8" />

        <Field icon={Target} label="יעד אימונים שבועי">
          <div className="flex items-center gap-2">
            {[3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => { vibrate(5); dispatch({ type: 'profile', patch: { weeklyGoal: n } }); }}
                className="press tnum flex size-9 items-center justify-center rounded-xl text-sm font-bold"
                style={{
                  background: profile.weeklyGoal === n ? 'var(--color-volt)' : 'rgba(255,255,255,0.06)',
                  color: profile.weeklyGoal === n ? '#0a1500' : '#94a3b8',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </Field>

        <div className="h-px bg-white/8" />

        <Field icon={Zap} label="יחידת הזנה במכון">
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              {[['kg', 'ק״ג'], ['lb', 'lb']].map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => dispatch({ type: 'profile', patch: { unit: v } })}
                  className="press rounded-xl px-3.5 py-1.5 text-sm font-bold"
                  style={{
                    background: profile.unit === v ? 'var(--color-volt)' : 'rgba(255,255,255,0.06)',
                    color: profile.unit === v ? '#0a1500' : '#94a3b8',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[var(--color-muted-foreground)]">התצוגה תמיד מציגה גם ליברות וגם ק״ג · לכל תרגיל אפשר לקבוע יחידה משלו באימון</p>
          </div>
        </Field>
      </GlassCard>

      <GymAutoStartCard profile={profile} routines={state.routines} dispatch={dispatch} />

      <CloudAccount />

      <DataTools state={state} dispatch={dispatch} />

      <p className="text-center text-xs text-[var(--color-muted-foreground)]">LiftLog · גרסה 1.0</p>
    </div>
  );
}

function GymAutoStartCard({ profile, routines, dispatch }) {
  const config = profile.gymAutoStart;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const hasLocation = hasGymLocation(config);

  function patchGymAutoStart(patch) {
    dispatch({ type: 'profile', patch: { gymAutoStart: { ...config, ...patch } } });
  }

  function saveCurrentLocation() {
    setMsg('');
    setErr('');
    if (!navigator.geolocation) {
      setErr('המכשיר לא תומך בזיהוי מיקום בדפדפן הזה');
      return;
    }

    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        patchGymAutoStart({
          enabled: true,
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
        setMsg('מיקום המכון נשמר');
        setBusy(false);
        vibrate(10);
      },
      () => {
        setErr('לא ניתן היה לקבל מיקום. בדוק שהרשאת המיקום פתוחה');
        setBusy(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
  }

  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: 'rgba(94,194,245,0.12)' }}>
          <MapPin className="size-5 text-[var(--color-cyan)]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">התחלה אוטומטית במכון</p>
          <p className="text-xs leading-5 text-[var(--color-muted-foreground)]">
            עובד כשהאפליקציה פתוחה. לזיהוי ברקע מלא צריך גרסת Android/iPhone native.
          </p>
        </div>
        <button
          onClick={() => patchGymAutoStart({ enabled: !config.enabled })}
          role="switch"
          aria-checked={config.enabled}
          aria-label="התחלה אוטומטית במכון"
          className="press relative h-6 w-11 shrink-0 rounded-full transition-colors"
          style={{ background: config.enabled ? 'var(--color-volt)' : 'rgba(255,255,255,0.12)' }}
        >
          <span
            className="absolute top-0.5 size-5 rounded-full bg-white transition-all"
            style={{ insetInlineStart: config.enabled ? '1.5rem' : '0.125rem' }}
          />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={saveCurrentLocation}
          disabled={busy}
          className="press glass flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4 text-[var(--color-cyan)]" />}
          שמור מיקום
        </button>
        <label className="glass flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold">
          <RadioTower className="size-4 text-[var(--color-muted-foreground)]" />
          <input
            type="number"
            min="30"
            max="500"
            step="10"
            inputMode="numeric"
            value={config.radiusM}
            onChange={(e) => patchGymAutoStart({ radiusM: Math.max(30, Math.min(500, Number(e.target.value) || 120)) })}
            className="tnum min-w-0 flex-1 bg-transparent text-center outline-none"
            aria-label="רדיוס זיהוי במטרים"
          />
          מ׳
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
        אימון שייפתח בהגעה
        <select
          value={config.routineId || 'free'}
          onChange={(e) => patchGymAutoStart({ routineId: e.target.value })}
          className="glass rounded-2xl px-4 py-3 text-sm font-bold text-[var(--color-card-foreground)] outline-none [color-scheme:dark]"
        >
          <option value="free" style={{ background: '#15181d', color: '#e7ecf1' }}>אימון חופשי</option>
          {routines.map((routine) => (
            <option key={routine.id} value={routine.id} style={{ background: '#15181d', color: '#e7ecf1' }}>
              {routine.name || 'תוכנית ללא שם'}
            </option>
          ))}
        </select>
      </label>

      {hasLocation && (
        <p className="tnum text-xs font-semibold text-[var(--color-muted-foreground)]">
          נשמר: {Number(config.latitude).toFixed(5)}, {Number(config.longitude).toFixed(5)}
        </p>
      )}
      {!hasLocation && <p className="text-xs font-semibold text-amber-300">שמור מיקום כדי שהזיהוי יוכל לפעול.</p>}
      {msg && <p className="text-xs font-semibold text-[var(--color-volt)]">{msg}</p>}
      {err && <p className="text-xs font-semibold text-rose-400">{err}</p>}
    </GlassCard>
  );
}

const STATUS = {
  syncing: { icon: Loader2, color: '#94a3b8', text: 'מסנכרן…', spin: true },
  synced: { icon: CheckCircle2, color: 'var(--color-volt)', text: 'מסונכרן' },
  error: { icon: AlertCircle, color: 'var(--color-rose)', text: 'שגיאת סנכרון' },
  idle: { icon: Cloud, color: '#94a3b8', text: '' },
};

function CloudAccount() {
  const { user, status, error, login, register, logout, bioOn, enableBiometric, disableBiometric } = useCloud();
  const [mode, setMode] = useState('login'); // login | register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [bioSupported, setBioSupported] = useState(false);
  const [bioErr, setBioErr] = useState('');

  useEffect(() => {
    biometricSupported().then(setBioSupported);
  }, []);

  async function toggleBio() {
    setBioErr('');
    try {
      if (bioOn) disableBiometric();
      else await enableBiometric();
    } catch (err) {
      setBioErr(err.message || 'הפעלת טביעת האצבע נכשלה');
    }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setFormErr('');
    try {
      await (mode === 'login' ? login(email, password) : register(email, password));
      setEmail('');
      setPassword('');
    } catch (err) {
      setFormErr(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    const s = STATUS[status] || STATUS.idle;
    const Icon = s.icon;
    return (
      <GlassCard className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl" style={{ background: 'rgba(198,242,78,0.14)' }}>
            <Cloud className="size-5" style={{ color: 'var(--color-volt)' }} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{user.email}</p>
            <p className="flex items-center gap-1.5 text-xs" style={{ color: s.color }}>
              <Icon className={`size-3.5 ${s.spin ? 'animate-spin' : ''}`} />
              {status === 'error' ? error || s.text : s.text}
            </p>
          </div>
          <button onClick={logout} className="press flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-[var(--color-muted-foreground)]">
            <LogOut className="size-3.5" /> התנתק
          </button>
        </div>

        {bioSupported && (
          <>
            <div className="h-px bg-white/8" />
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2.5 text-sm font-semibold">
                <Fingerprint className="size-4 text-[var(--color-muted-foreground)]" />
                כניסה בטביעת אצבע
              </span>
              <button
                onClick={toggleBio}
                role="switch"
                aria-checked={bioOn}
                aria-label="כניסה בטביעת אצבע"
                className="press relative h-6 w-11 shrink-0 rounded-full transition-colors"
                style={{ background: bioOn ? 'var(--color-volt)' : 'rgba(255,255,255,0.12)' }}
              >
                <span
                  className="absolute top-0.5 size-5 rounded-full bg-white transition-all"
                  style={{ insetInlineStart: bioOn ? '1.5rem' : '0.125rem' }}
                />
              </button>
            </div>
            {bioErr && <p className="text-xs font-semibold text-rose-400">{bioErr}</p>}
          </>
        )}
      </GlassCard>
    );
  }

  return (
    <GlassCard className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <CloudOff className="size-5 text-[var(--color-muted-foreground)]" />
        </span>
        <div>
          <p className="text-sm font-bold">סנכרון ענן</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">התחבר כדי לגבות ולסנכרן בין מכשירים</p>
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-2">
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="אימייל" autoComplete="email"
          className="rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none focus:bg-white/10 placeholder:text-[var(--color-muted-foreground)]"
        />
        <input
          type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="סיסמה (6+ תווים)" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          className="rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none focus:bg-white/10 placeholder:text-[var(--color-muted-foreground)]"
        />
        {formErr && <p className="text-xs font-semibold text-rose-400">{formErr}</p>}
        <button type="submit" disabled={busy} className="btn-volt press flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold disabled:opacity-50">
          {busy && <Loader2 className="size-4 animate-spin" />}
          {mode === 'login' ? 'התחבר' : 'צור חשבון'}
        </button>
      </form>

      <button
        onClick={() => { setMode((m) => (m === 'login' ? 'register' : 'login')); setFormErr(''); }}
        className="press text-center text-xs font-semibold text-[var(--color-volt)]"
      >
        {mode === 'login' ? 'אין לך חשבון? הרשמה' : 'כבר יש לך חשבון? התחברות'}
      </button>
    </GlassCard>
  );
}

function DataTools({ state, dispatch }) {
  const { user, replaceCloudState } = useCloud();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  function downloadBackup() {
    const payload = {
      app: 'MassApp',
      version: 2,
      exportedAt: new Date().toISOString(),
      state: syncedSlice(state),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `massapp-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg('הגיבוי ירד למכשיר');
    setErr('');
  }

  async function applyData(nextData) {
    const next = syncedSlice(nextData.state || nextData);
    dispatch({ type: 'replaceAll', data: next });
    if (user) await replaceCloudState(next);
  }

  async function importBackup(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setMsg('');
    setErr('');
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await applyData(parsed);
      setMsg(user ? 'הגיבוי יובא וסונכרן לענן' : 'הגיבוי יובא למכשיר');
    } catch (importErr) {
      setErr(importErr.message || 'ייבוא הגיבוי נכשל');
    } finally {
      setBusy(false);
    }
  }

  async function clearAll() {
    if (!confirm(user ? 'לאפס את כל הנתונים במכשיר ובענן? פעולה זו אינה הפיכה.' : 'לאפס את כל הנתונים במכשיר? פעולה זו אינה הפיכה.')) return;
    setBusy(true);
    setMsg('');
    setErr('');
    try {
      const next = syncedSlice(seed());
      dispatch({ type: 'resetAll' });
      if (user) await replaceCloudState(next);
      setMsg(user ? 'הנתונים אופסו גם בענן' : 'הנתונים אופסו במכשיר');
    } catch (resetErr) {
      setErr(resetErr.message || 'האיפוס נכשל');
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassCard className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-bold">גיבוי ונתונים</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">ייצוא, ייבוא או איפוס מלא של נתוני האימונים</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={downloadBackup} className="press glass flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold">
          <Download className="size-4" /> ייצוא
        </button>
        <button onClick={() => fileRef.current?.click()} disabled={busy} className="press glass flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold disabled:opacity-50">
          <Upload className="size-4" /> ייבוא
        </button>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" onChange={importBackup} className="hidden" />
      <button
        onClick={clearAll}
        disabled={busy}
        className="press flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-3 text-sm font-bold text-rose-300 disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        איפוס כל הנתונים
      </button>
      {msg && <p className="text-xs font-semibold text-[var(--color-volt)]">{msg}</p>}
      {err && <p className="text-xs font-semibold text-rose-400">{err}</p>}
    </GlassCard>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex shrink-0 items-center gap-2.5 text-sm font-semibold">
        <Icon className="size-4 text-[var(--color-muted-foreground)]" />
        {label}
      </span>
      {children}
    </div>
  );
}
