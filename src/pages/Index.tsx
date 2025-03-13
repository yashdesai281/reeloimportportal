
import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import FileUpload from '@/components/FileUpload';
import ColumnMapping from '@/components/ColumnMapping';
import ContactsMapping from '@/components/ContactsMapping';
import ContactsConfirmation from '@/components/ContactsConfirmation';
import ProcessingStatus from '@/components/ProcessingStatus';
import ProcessingHistory from '@/components/ProcessingHistory';
import { 
  processFile, 
  downloadFile, 
  generateContactsFile, 
  ColumnMapping as ColumnMappingType,
  ContactsColumnMapping 
} from '@/utils/fileProcessing';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, History } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ErrorBoundary, ContactsMappingError } from '@/components/ErrorHandler';

// Application steps
enum AppStep {
  UPLOAD,
  COLUMN_MAPPING,
  CONTACTS_CONFIRMATION,
  CONTACTS_MAPPING,
  PROCESSING,
  COMPLETE
}

// File processing result
interface ProcessedFile {
  data: Blob;
  fileName: string;
}

const Index = () => {
  // Application state
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.UPLOAD);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMappingType | null>(null);
  const [rawFileData, setRawFileData] = useState<any[][] | null>(null);
  const [hasContactData, setHasContactData] = useState<boolean>(false);
  const [transactionFile, setTransactionFile] = useState<ProcessedFile | null>(null);
  const [contactsFile, setContactsFile] = useState<ProcessedFile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'upload' | 'history'>('upload');
  const [processingError, setProcessingError] = useState<Error | null>(null);

  // Check Supabase connection on load
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.from('processed_files').select('count').single();
        console.log('Supabase connection check:', data !== null ? 'Connected' : 'Error', error);
        setIsLoading(false);
      } catch (err) {
        console.error('Error connecting to Supabase:', err);
        setIsLoading(false);
      }
    };
    
    checkConnection();
  }, []);

  // File selection handler
  const handleFileSelected = (file: File) => {
    console.log("File selected:", file.name);
    setSelectedFile(file);
    setCurrentStep(AppStep.COLUMN_MAPPING);
  };

  // Column mapping completion handler
  const handleColumnMappingComplete = async (mapping: ColumnMappingType) => {
    console.log("Column mapping completed:", mapping);
    setColumnMapping(mapping);
    setCurrentStep(AppStep.PROCESSING);
    setProcessingError(null);

    try {
      if (selectedFile) {
        console.log("Starting file processing...");
        const result = await processFile(selectedFile, mapping);
        console.log("File processing complete");
        
        setTransactionFile({
          data: result.transactionData,
          fileName: result.transactionFileName
        });
        setRawFileData(result.rawData);
        setHasContactData(result.hasContactData);
        
        if (result.hasContactData) {
          setCurrentStep(AppStep.CONTACTS_CONFIRMATION);
        } else {
          setCurrentStep(AppStep.COMPLETE);
          toast({
            title: "Success",
            description: "Transaction file processed successfully.",
          });
        }
      }
    } catch (error) {
      console.error('Error during file processing:', error);
      setProcessingError(error instanceof Error ? error : new Error('Unknown error'));
      toast({
        variant: "destructive",
        title: "Error processing file",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
      setCurrentStep(AppStep.COMPLETE);
    }
  };

  // Contacts confirmation handler
  const handleContactsConfirmation = (generate: boolean) => {
    if (generate) {
      console.log("User confirmed contacts file generation");
      setCurrentStep(AppStep.CONTACTS_MAPPING);
    } else {
      setCurrentStep(AppStep.COMPLETE);
      toast({
        title: "Success",
        description: "Transaction file processed successfully.",
      });
    }
  };

  // Contacts mapping completion handler
  const handleContactsMappingComplete = async (mapping: ContactsColumnMapping) => {
    console.log("Contacts mapping completed:", mapping);
    setCurrentStep(AppStep.PROCESSING);
    setProcessingError(null);

    try {
      if (rawFileData) {
        console.log("Starting contacts file generation...");
        const result = await generateContactsFile(rawFileData, mapping);
        console.log("Contacts file generation complete");
        
        setContactsFile(result);
        setCurrentStep(AppStep.COMPLETE);
        toast({
          title: "Success",
          description: "Both files processed successfully.",
        });
      }
    } catch (error) {
      console.error('Error generating contacts file:', error);
      setProcessingError(error instanceof Error ? error : new Error('Unknown error'));
      toast({
        variant: "destructive",
        title: "Error generating contacts file",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
      setCurrentStep(AppStep.COMPLETE);
    }
  };

  // File download handlers
  const handleDownloadTransaction = () => {
    if (transactionFile) {
      downloadFile(transactionFile.data, transactionFile.fileName);
      toast({
        title: "Success",
        description: "Transaction file download started",
      });
    }
  };

  const handleDownloadContacts = () => {
    if (contactsFile) {
      downloadFile(contactsFile.data, contactsFile.fileName);
      toast({
        title: "Success",
        description: "Contacts file download started",
      });
    }
  };

  // Reset application state
  const resetApp = () => {
    console.log("Resetting application state");
    setCurrentStep(AppStep.UPLOAD);
    setSelectedFile(null);
    setColumnMapping(null);
    setRawFileData(null);
    setHasContactData(false);
    setTransactionFile(null);
    setContactsFile(null);
    setProcessingError(null);
  };

  // Navigation handler
  const handleBack = () => {
    if (currentStep === AppStep.COLUMN_MAPPING) {
      setCurrentStep(AppStep.UPLOAD);
    } else if (currentStep === AppStep.CONTACTS_CONFIRMATION) {
      setCurrentStep(AppStep.COLUMN_MAPPING);
    } else if (currentStep === AppStep.CONTACTS_MAPPING) {
      setCurrentStep(AppStep.CONTACTS_CONFIRMATION);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-6 w-40 bg-slate-200 rounded mb-4"></div>
          <div className="h-4 w-60 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Debug logs
  console.log("Current application state:", {
    step: AppStep[currentStep],
    currentStep,
    hasFile: !!selectedFile,
    hasMapping: !!columnMapping,
    hasRawData: !!rawFileData,
    hasContactData,
    hasTransactionFile: !!transactionFile,
    hasContactsFile: !!contactsFile,
    hasError: !!processingError
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-secondary/30 flex flex-col items-center px-4">
      <header className="w-full py-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block mb-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
            Transaction File Import
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Transform Your Data</h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your transaction files and map columns to generate standardized outputs
          </p>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-6">
        <div className="w-full max-w-md mx-auto mb-8 flex bg-muted/30 rounded-lg p-1">
          <Button 
            variant={viewMode === 'upload' ? 'default' : 'ghost'} 
            size="sm" 
            className="flex-1 gap-1.5" 
            onClick={() => setViewMode('upload')}
          >
            <Upload className="h-4 w-4" />
            Upload & Process
          </Button>
          <Button 
            variant={viewMode === 'history' ? 'default' : 'ghost'} 
            size="sm" 
            className="flex-1 gap-1.5" 
            onClick={() => setViewMode('history')}
          >
            <History className="h-4 w-4" />
            History
          </Button>
        </div>

        {viewMode === 'upload' && (
          <>
            <div className="w-full max-w-2xl mx-auto mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-medium">
                  {currentStep === AppStep.UPLOAD && 'Upload File'}
                  {currentStep === AppStep.COLUMN_MAPPING && 'Map Transaction Columns'}
                  {currentStep === AppStep.CONTACTS_CONFIRMATION && 'Confirm Contacts File'}
                  {currentStep === AppStep.CONTACTS_MAPPING && 'Map Contacts Columns'}
                  {currentStep === AppStep.PROCESSING && 'Processing'}
                  {currentStep === AppStep.COMPLETE && 'Complete'}
                </h2>
                
                {currentStep !== AppStep.UPLOAD && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetApp}
                    className="text-muted-foreground"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Start Over
                  </Button>
                )}
              </div>
              <div className="w-full bg-secondary h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-500 ease-in-out"
                  style={{ 
                    width: `${(currentStep / (Object.keys(AppStep).length / 2 - 1)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

            <div className="w-full transition-all duration-300 ease-in-out">
              <ErrorBoundary>
                {currentStep === AppStep.UPLOAD && (
                  <div className="animate-fade-in">
                    <FileUpload 
                      onFileSelected={handleFileSelected} 
                      accept=".csv,.xlsx,.xls" 
                    />
                  </div>
                )}

                {currentStep === AppStep.COLUMN_MAPPING && (
                  <div className="animate-fade-in">
                    <ColumnMapping 
                      step={1} 
                      onComplete={handleColumnMappingComplete}
                      onBack={handleBack}
                    />
                  </div>
                )}

                {currentStep === AppStep.CONTACTS_CONFIRMATION && (
                  <div className="animate-fade-in">
                    <ContactsConfirmation
                      onConfirm={() => handleContactsConfirmation(true)}
                      onCancel={() => handleContactsConfirmation(false)}
                    />
                  </div>
                )}

                {currentStep === AppStep.CONTACTS_MAPPING && rawFileData && (
                  <div className="animate-fade-in">
                    <ErrorBoundary fallback={<ContactsMappingError onReset={resetApp} />}>
                      <ContactsMapping
                        onComplete={handleContactsMappingComplete}
                        onCancel={() => setCurrentStep(AppStep.COMPLETE)}
                        rawData={rawFileData}
                      />
                    </ErrorBoundary>
                  </div>
                )}

                {(currentStep === AppStep.PROCESSING || currentStep === AppStep.COMPLETE) && (
                  <div className="animate-fade-in">
                    <ProcessingStatus
                      isProcessing={currentStep === AppStep.PROCESSING}
                      isComplete={currentStep === AppStep.COMPLETE}
                      transactionFileName={transactionFile?.fileName || null}
                      contactsFileName={contactsFile?.fileName || null}
                      onDownloadTransaction={handleDownloadTransaction}
                      onDownloadContacts={handleDownloadContacts}
                      onReset={resetApp}
                      error={processingError}
                    />
                  </div>
                )}
              </ErrorBoundary>
            </div>
          </>
        )}

        {viewMode === 'history' && (
          <div className="w-full max-w-2xl mx-auto animate-fade-in">
            <ProcessingHistory />
          </div>
        )}
      </main>

      <footer className="w-full py-6 border-t bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          Transaction File Import Portal — Process your transaction data with ease.
        </div>
      </footer>
    </div>
  );
};

export default Index;
