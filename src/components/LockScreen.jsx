import { useEffect, useState } from 'react';
import { Fingerprint, Zap, Loader2, Lock } from 'lucide-react';
import { useCloud } from '../cloud.jsx';

/** Full-screen gate shown on app open when a remembered session is biometric-protected. */
export default function LockScreen() {
  const { unlock, login, lockedEmail } = useCloud();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');

  async function tapFingerprint() {
    setErr('');
    setBusy(true);
    try {
      await unlock();
    } catch (e) {
      setErr(e?.message || 'האימות נכשל, נסה שוב');
    } finally {
      setBusy(false);
    }
  }

  async function submitPassword(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(lockedEmail, password);
      setPassword('');
    } catch (e2) {
      setErr(e2?.message || 'אימייל או סיסמה שגויים');
    } finally {
      setBusy(false);
    }
  }

  // Esc on the keyboard does nothing useful here; lock stays until verified.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 bg-[var(--surface-solid)] px-6 pb-[max(1.5rem,var(--safe-b))] pt-[max(1.5rem,var(--safe-t))]">
      <div className="flex flex-col items-center gap-3">
        <span className="btn-volt flex size-14 items-center justify-center rounded-3xl">
          <Zap className="size-7" strokeWidth={2.4} />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight">LiftLog</h1>
        {lockedEmail && <p className="text-sm text-[var(--color-muted-foreground)]">{lockedEmail}</p>}
      </div>

      {!usePassword ? (
        <div className="flex w-full max-w-xs flex-col items-center gap-5">
          <button
            onClick={tapFingerprint}
            disabled={busy}
            aria-label="כניסה בטביעת אצבע"
            className="press flex size-24 items-center justify-center rounded-full disabled:opacity-60"
            style={{ background: 'rgba(198,242,78,0.12)', border: '1px solid var(--hairline)' }}
          >
            {busy ? (
              <Loader2 className="size-10 animate-spin" style={{ color: 'var(--color-volt)' }} />
            ) : (
              <Fingerprint className="size-12" style={{ color: 'var(--color-volt)' }} />
            )}
          </button>
          <p className="text-center text-sm font-semibold text-[var(--color-muted-foreground)]">
            הנח את האצבע כדי להיכנס
          </p>
        </div>
      ) : (
        <form onSubmit={submitPassword} className="flex w-full max-w-xs flex-col gap-3">
          <input
            type="email" value={lockedEmail} readOnly autoComplete="email"
            className="rounded-xl bg-white/5 px-3 py-2.5 text-sm text-[var(--color-muted-foreground)] outline-none"
          />
          <input
            type="password" required autoFocus value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמה" autoComplete="current-password"
            className="rounded-xl bg-white/5 px-3 py-2.5 text-sm outline-none focus:bg-white/10 placeholder:text-[var(--color-muted-foreground)]"
          />
          <button type="submit" disabled={busy} className="btn-volt press flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold disabled:opacity-50">
            {busy && <Loader2 className="size-4 animate-spin" />}
            התחבר
          </button>
        </form>
      )}

      {err && <p className="text-sm font-semibold text-rose-400">{err}</p>}

      <button
        onClick={() => { setUsePassword((v) => !v); setErr(''); }}
        className="press flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted-foreground)]"
      >
        {usePassword ? <Fingerprint className="size-3.5" /> : <Lock className="size-3.5" />}
        {usePassword ? 'כניסה בטביעת אצבע' : 'כניסה עם סיסמה'}
      </button>
    </div>
  );
}
