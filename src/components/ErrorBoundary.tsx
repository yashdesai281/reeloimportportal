
import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Component error caught by ErrorBoundary:", error);
    console.error("Component stack trace:", errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <h3 className="text-xl font-semibold text-destructive mb-4">Something went wrong</h3>
          <p className="mb-6 text-muted-foreground">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          {this.props.onReset && (
            <Button onClick={this.props.onReset} variant="default">Reset</Button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
