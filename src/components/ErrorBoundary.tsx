import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="max-w-[540px] mx-auto px-4 py-16 text-center">
          <p className="font-mono text-[12px] text-g3 mb-2">Terjadi kesalahan</p>
          <p className="font-mono text-[11px] text-soft/60 mb-4">{this.state.error.message}</p>
          <button
            className="bg-pop text-[#1a0a12] border-0 rounded-xl px-6 py-3 font-display font-semibold text-[14px] cursor-pointer"
            onClick={() => this.setState({ error: null })}
          >
            Coba Lagi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
