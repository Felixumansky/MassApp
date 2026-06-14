import { Component } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';

export default class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('MassApp render error', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="mx-auto flex min-h-dvh max-w-md items-center px-4 py-10">
        <section className="glass w-full p-8 text-center" role="alert">
          <TriangleAlert size={38} className="mx-auto text-orange-300" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-extrabold text-slate-100">משהו השתבש בתצוגה</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            הנתונים שלך לא נמחקו. אפשר לרענן את האפליקציה ולנסות שוב.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-fire press mx-auto mt-5 flex items-center gap-2 rounded-full px-6 py-3 font-bold text-white"
          >
            <RefreshCw size={17} /> רענון האפליקציה
          </button>
        </section>
      </main>
    );
  }
}
