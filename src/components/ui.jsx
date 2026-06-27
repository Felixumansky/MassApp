import { cn } from '../lib/utils.js';
import { muscleById } from '../lib/exercises.js';

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
