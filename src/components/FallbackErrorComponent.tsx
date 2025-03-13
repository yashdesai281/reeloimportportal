
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface FallbackErrorComponentProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

const FallbackErrorComponent: React.FC<FallbackErrorComponentProps> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md text-center">
      <AlertCircle className="h-10 w-10 text-destructive mb-4" />
      <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
      
      <p className="mb-6 text-muted-foreground">
        {error?.message || 'An unexpected error occurred while processing your request.'}
      </p>
      
      <div className="flex gap-4">
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reload Page
        </Button>
        
        {resetErrorBoundary && (
          <Button 
            onClick={resetErrorBoundary}
            className="gap-2"
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};

export default FallbackErrorComponent;
