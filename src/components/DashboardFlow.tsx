
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, History } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import ColumnMapping from '@/components/ColumnMapping';
import ContactsMapping from '@/components/ContactsMapping';
import ContactsConfirmation from '@/components/ContactsConfirmation';
import ProcessingStatus from '@/components/ProcessingStatus';
import ProcessingHistory from '@/components/ProcessingHistory';
import ProcessingStats from '@/components/ProcessingStats';
import { ErrorBoundary, ContactsMappingError } from '@/components/ErrorHandler';
import { AppStep, UseDashboardLogicReturn } from '@/hooks/useDashboardLogic';

interface DashboardFlowProps extends UseDashboardLogicReturn {}

const DashboardFlow: React.FC<DashboardFlowProps> = ({
  currentStep,
  viewMode,
  selectedFile,
  columnMapping,
  rawFileData,
  hasContactData,
  transactionFile,
  contactsFile,
  isLoading,
  processingError,
  currentStats,
  setViewMode,
  handleFileSelected,
  handleColumnMappingComplete,
  handleContactsConfirmation,
  handleContactsMappingComplete,
  handleDownloadTransaction,
  handleDownloadContacts,
  resetApp,
  handleBack
}) => {
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

  return (
    <div className="w-full max-w-4xl mx-auto">
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
                      onCancel={resetApp}
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
      
      {/* Processing Stats Component - Always visible at the bottom */}
      <div className="w-full max-w-2xl mx-auto mt-12">
        <ProcessingStats currentStats={currentStats} />
      </div>
    </div>
  );
};

export default DashboardFlow;
