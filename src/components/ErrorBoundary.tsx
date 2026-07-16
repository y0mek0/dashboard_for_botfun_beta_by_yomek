import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public override state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[Botic] Panel crashed:', error.message);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="panel relative flex flex-col h-full items-center justify-center gap-2 p-4">
          <div className="corner-marker corner-tl" />
          <div className="corner-marker corner-tr" />
          <div className="corner-marker corner-bl" />
          <div className="corner-marker corner-br" />
          <span className="text-red-neon text-[10px] font-mono font-bold">PANEL ERROR</span>
          <span className="text-[9px] text-white/30 font-mono">{this.state.error?.message?.slice(0, 50)}</span>
        </div>
      );
    }
    return this.props.children;
  }
}
