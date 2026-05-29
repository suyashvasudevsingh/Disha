import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMsg = this.state.error?.message || 'An unexpected error occurred';
      
      return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 bg-surface/30">
          <Card className="w-full max-w-lg rounded-[32px] border-red-100 bg-white shadow-xl shadow-red-100/20 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-50 to-red-100/50 border-b border-red-100/80 px-6 py-5">
              <div className="flex items-center gap-3 text-red-600">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-100/80">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-800/60">Application Error</div>
                  <h2 className="text-xl font-display font-bold">Something went wrong</h2>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 py-6 space-y-6">
              <p className="text-sm leading-relaxed text-ink/75">
                The application encountered an error while rendering this page. This could be due to a microphone access issue, browser API limitation, or worker loading error.
              </p>
              
              <div className="rounded-2xl bg-red-50/50 border border-red-100 p-4 font-mono text-xs text-red-700 break-all whitespace-pre-wrap max-h-40 overflow-y-auto">
                {errorMsg}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button 
                  onClick={this.handleReset}
                  className="h-12 rounded-2xl bg-primary text-white hover:bg-primary-dark flex items-center gap-2 px-5"
                >
                  <RotateCcw size={16} />
                  Retry Page
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="h-12 rounded-2xl border-primary-light flex items-center gap-2 px-5 text-ink/70"
                >
                  <Home size={16} />
                  Go to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
