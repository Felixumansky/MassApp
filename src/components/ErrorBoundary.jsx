import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import { GlassCard } from './ui.jsx';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <GlassCard className="max-w-sm text-center">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
            <AlertTriangle className="size-6" />
          </span>
          <h1 className="mb-2 text-xl font-extrabold tracking-normal">משהו השתבש</h1>
          <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
            הנתונים המקומיים נשמרו. רענון קצר בדרך כלל מחזיר את האפליקציה למסלול.
          </p>
          <button onClick={() => location.reload()} className="btn-volt press w-full rounded-xl py-3 text-sm font-bold">
            רענן אפליקציה
          </button>
        </GlassCard>
      </div>
    );
  }
}
