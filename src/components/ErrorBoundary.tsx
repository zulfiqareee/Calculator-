import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('sut_recents_v1');
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 text-center flex flex-col items-center gap-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                সাময়িক ত্রুটি হয়েছে / Something went wrong
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                অ্যাপটি নিরাপদ মোডে রিকভার করা হচ্ছে। নিচের বোতামে চাপ দিয়ে পুনরায় লোড করুন।
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 bg-slate-950/80 rounded-xl text-[11px] font-mono text-rose-300 max-h-24 overflow-y-auto text-left w-full border border-slate-800">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              <span>পুনরায় চালু করুন / Reload App</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
