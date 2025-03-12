
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Loader2 } from 'lucide-react';

interface ProcessingStatusProps {
  isProcessing: boolean;
  isComplete: boolean;
  fileName: string | null;
  onDownload: () => void;
  onReset: () => void;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  isProcessing,
  isComplete,
  fileName,
  onDownload,
  onReset,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-white glass rounded-xl p-8 flex flex-col items-center animate-scale-in">
        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-secondary rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-primary rounded-full animate-spinner"></div>
            </div>
            <h3 className="mt-6 text-xl font-medium">Processing your file</h3>
            <p className="mt-2 text-muted-foreground text-center">
              This might take a moment depending on the file size
            </p>
          </div>
        )}

        {isComplete && (
          <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            
            <h3 className="text-xl font-medium text-center">File processed successfully</h3>
            
            {fileName && (
              <p className="mt-2 text-muted-foreground text-center">
                Your file <span className="font-medium text-foreground">{fileName}</span> is ready for download
              </p>
            )}
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-sm">
              <Button
                onClick={onDownload}
                className="flex-1 h-12 group"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5 transition-transform group-hover:-translate-y-1" />
                Download File
              </Button>
              
              <Button
                onClick={onReset}
                variant="outline"
                className="flex-1 h-12"
                size="lg"
              >
                Process Another File
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingStatus;
