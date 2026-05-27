import React, { ErrorInfo } from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-chess-darker flex flex-col items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-chess-accent/10 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="glass-panel p-8 md:p-12 rounded-3xl max-w-3xl w-full border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.15)] relative z-10 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30 text-3xl">
                ⚠️
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">System Error</h1>
                <p className="text-red-400">KnightShift encountered an unexpected issue.</p>
              </div>
            </div>
            
            <div className="bg-black/40 rounded-xl p-4 border border-white/5 overflow-x-auto custom-scrollbar mb-6">
              <pre className="text-red-300 font-mono text-sm whitespace-pre-wrap">{this.state.error?.message}</pre>
            </div>
            
            <details className="group cursor-pointer">
              <summary className="text-chess-muted hover:text-white transition-colors text-sm font-bold flex items-center gap-2 select-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-open:rotate-90" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                View Stack Trace
              </summary>
              <div className="mt-4 bg-black/40 rounded-xl p-4 border border-white/5 overflow-x-auto custom-scrollbar max-h-64 overflow-y-auto">
                <pre className="text-gray-400 font-mono text-xs whitespace-pre-wrap">{this.state.error?.stack}</pre>
              </div>
            </details>
            
            <div className="mt-8 flex justify-end">
              <button onClick={() => window.location.reload()} className="bg-gradient-to-r from-red-600 to-red-500 text-white font-bold py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] transform hover:-translate-y-0.5 transition-all">
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
