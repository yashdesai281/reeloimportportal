
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Loader2, FileText, Users } from 'lucide-react';

interface ProcessingStatusProps {
  isProcessing: boolean;
  isComplete: boolean;
  transactionFileName: string | null;
  contactsFileName: string | null;
  onDownloadTransaction: () => void;
  onDownloadContacts: () => void;
  onReset: () => void;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  isProcessing,
  isComplete,
  transactionFileName,
  contactsFileName,
  onDownloadTransaction,
  onDownloadContacts,
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
          <div className="flex flex-col items-center justify-center py-8 animate-fade-in w-full">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            
            <h3 className="text-xl font-medium text-center">Processing Complete</h3>
            
            <p className="mt-2 text-muted-foreground text-center">
              Your files are ready for download
            </p>
            
            <div className="mt-8 w-full space-y-4">
              {transactionFileName && (
                <div className="border rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Transaction File</p>
                      <p className="text-xs text-muted-foreground">{transactionFileName}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="gap-1.5"
                    onClick={onDownloadTransaction}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              )}
              
              {contactsFileName && (
                <div className="border rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Contacts File</p>
                      <p className="text-xs text-muted-foreground">{contactsFileName}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="gap-1.5"
                    onClick={onDownloadContacts}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              )}
              
              <Button
                onClick={onReset}
                variant="outline"
                className="w-full h-10 mt-4"
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
