import { useState } from 'react';
import { cn, fmtWeight, toKg } from '../lib/utils.js';
import { muscleById } from '../lib/exercises.js';

/**
 * Weight input that displays/accepts values in the user's chosen unit while
 * committing kg (canonical) to the store. Keeps a local draft string while
 * focused so decimals/partial input ("60.") aren't mangled by conversion.
 */
export function WeightInput({ kg, unit, onCommit, className, ...rest }) {
  const [draft, setDraft] = useState(null); // null = not editing
  const stored = kg === '' || kg == null ? '' : String(fmtWeight(kg, unit));
  const value = draft ?? stored;
  return (
    <input
      type="number"
      inputMode="decimal"
      step="0.5"
      value={value}
      onFocus={() => setDraft(stored)}
      onChange={(e) => { setDraft(e.target.value); onCommit(toKg(e.target.value, unit)); }}
      onBlur={() => setDraft(null)}
      className={className}
      {...rest}
    />
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <header className="fade-up mb-5 flex items-end justify-between gap-3 pt-2">
      <div>
        {subtitle && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
            {subtitle}
          </p>
        )}
        <h1 className="text-[32px] font-extrabold leading-none">{title}</h1>
      </div>
      {action}
    </header>
  );
}

export function GlassCard({ className, strong, glow, style, children, ...rest }) {
  return (
    <div
      className={cn('glass p-4', strong && 'glass-strong', glow && 'glow-volt', className)}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
}

export function MuscleTag({ muscle, className }) {
  const m = muscleById(muscle);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline)] px-2 py-0.5 text-xs font-medium text-[var(--color-muted-foreground)]',
        className
      )}
    >
      <span className="size-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="fade-up flex flex-col items-center gap-3 px-6 py-12 text-center">
      {Icon && (
        <span className="glass flex size-16 items-center justify-center rounded-3xl text-[var(--color-muted-foreground)]">
          <Icon className="size-7" />
        </span>
      )}
      <h3 className="text-lg font-bold">{title}</h3>
      {hint && <p className="max-w-xs text-sm text-[var(--color-muted-foreground)]">{hint}</p>}
      {action}
    </div>
  );
}

export function AppLoader({ label = 'טוען…' }) {
  return (
    <div className="flex min-h-40 items-center justify-center">
      <div className="flex items-center gap-2 rounded-xl border border-[var(--hairline)] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-[var(--color-muted-foreground)]">
        <span className="size-2 rounded-full bg-[var(--color-volt)] motion-safe:animate-pulse" />
        {label}
      </div>
    </div>
  );
}
