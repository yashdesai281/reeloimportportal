
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  processFile, 
  generateContactsFile, 
  ColumnMapping,
  ContactsColumnMapping,
  ProcessingStats,
  downloadFile
} from '@/utils/fileProcessing';
import { isExcelFile } from '@/utils/fileUtils';

// Application steps
export enum AppStep {
  UPLOAD,
  COLUMN_MAPPING,
  CONTACTS_CONFIRMATION,
  CONTACTS_MAPPING,
  PROCESSING,
  COMPLETE
}

// File processing result
export interface ProcessedFile {
  data: Blob;
  fileName: string;
  stats?: ProcessingStats;
}

export interface UseDashboardLogicReturn {
  currentStep: AppStep;
  viewMode: 'upload' | 'history';
  selectedFile: File | null;
  columnMapping: ColumnMapping | null;
  rawFileData: any[][] | null;
  hasContactData: boolean;
  transactionFile: ProcessedFile | null;
  contactsFile: ProcessedFile | null;
  isLoading: boolean;
  processingError: Error | null;
  currentStats: {
    totalFiles: number;
    totalRecords: number;
    validRecords: number;
    rejectedRecords: number;
  } | null;
  setViewMode: (mode: 'upload' | 'history') => void;
  handleFileSelected: (file: File) => void;
  handleColumnMappingComplete: (mapping: ColumnMapping) => Promise<void>;
  handleContactsConfirmation: (generate: boolean) => void;
  handleContactsMappingComplete: (mapping: ContactsColumnMapping) => Promise<void>;
  handleDownloadTransaction: () => void;
  handleDownloadContacts: () => void;
  resetApp: () => void;
  handleBack: () => void;
}

export const useDashboardLogic = (): UseDashboardLogicReturn => {
  // Application state
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.UPLOAD);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);
  const [rawFileData, setRawFileData] = useState<any[][] | null>(null);
  const [hasContactData, setHasContactData] = useState<boolean>(false);
  const [transactionFile, setTransactionFile] = useState<ProcessedFile | null>(null);
  const [contactsFile, setContactsFile] = useState<ProcessedFile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'upload' | 'history'>('upload');
  const [processingError, setProcessingError] = useState<Error | null>(null);
  const [currentStats, setCurrentStats] = useState<{
    totalFiles: number;
    totalRecords: number;
    validRecords: number;
    rejectedRecords: number;
  } | null>(null);

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
    
    // Validate file type
    if (!isExcelFile(file)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an Excel or CSV file",
      });
      return;
    }
    
    setSelectedFile(file);
    setCurrentStep(AppStep.COLUMN_MAPPING);
  };

  // Column mapping completion handler
  const handleColumnMappingComplete = async (mapping: ColumnMapping) => {
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
          fileName: result.transactionFileName,
          stats: result.stats
        });
        setRawFileData(result.rawData);
        setHasContactData(result.hasContactData);
        
        // Update current stats
        setCurrentStats({
          totalFiles: 1,
          totalRecords: result.stats.totalRecords,
          validRecords: result.stats.validRecords,
          rejectedRecords: result.stats.rejectedRecords
        });
        
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
        
        setContactsFile({
          data: result.data,
          fileName: result.fileName,
          stats: result.stats
        });
        
        // Update current stats to include contacts file stats
        setCurrentStats(prevStats => {
          if (!prevStats) return null;
          return {
            totalFiles: prevStats.totalFiles + 1,
            totalRecords: prevStats.totalRecords + result.stats.totalRecords,
            validRecords: prevStats.validRecords + result.stats.validRecords,
            rejectedRecords: prevStats.rejectedRecords + (result.stats.rejectedRecords + (result.stats.duplicateRecords || 0))
          };
        });
        
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
    setCurrentStats(null);
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
    hasError: !!processingError,
    currentStats
  });

  return {
    // State
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
    
    // Handlers
    setViewMode,
    handleFileSelected,
    handleColumnMappingComplete,
    handleContactsConfirmation,
    handleContactsMappingComplete,
    handleDownloadTransaction,
    handleDownloadContacts,
    resetApp,
    handleBack
  };
};

export default useDashboardLogic;
