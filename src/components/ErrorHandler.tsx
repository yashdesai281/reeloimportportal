
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error | null;
  onReset?: () => void;
  title?: string;
  message?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  onReset, 
  title = "An error occurred", 
  message = "There was a problem with this component."
}) => {
  return (
    <div className="p-8 bg-white rounded-lg shadow-md text-center">
      <div className="inline-flex items-center justify-center bg-red-50 p-3 rounded-full mb-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      
      <h3 className="text-xl font-semibold text-destructive mb-2">{title}</h3>
      
      <p className="mb-4 text-muted-foreground">{message}</p>
      
      {error && (
        <div className="bg-gray-50 p-4 mb-4 rounded-md text-left overflow-auto max-h-40 text-xs">
          <code className="text-gray-600">{error.toString()}</code>
        </div>
      )}
      
      {onReset && (
        <Button onClick={onReset} variant="default">Try Again</Button>
      )}
    </div>
  );
};

export const ContactsMappingError = ({ onReset }: { onReset: () => void }) => {
  return (
    <ErrorFallback
      title="Mapping Error"
      message="There was a problem with the contacts mapping component. This might be due to an issue with the data format."
      onReset={onReset}
    />
  );
};
