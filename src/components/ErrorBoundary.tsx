'use client';

import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    // TODO: Send to Sentry when configured
    // Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">&#9888;&#65039;</div>
            <h2 className="text-xl font-black text-black uppercase tracking-wide mb-2">
              Something went wrong
            </h2>
            <p className="text-[#666] text-sm mb-4">
              We hit a snag loading this section. Your vehicle data is safe.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-6 py-2 bg-[#FFC700] text-black font-bold uppercase tracking-wide text-sm hover:bg-[#e6b400] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
