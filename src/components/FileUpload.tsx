
import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { UploadIcon, File, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  accept: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected, accept }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  const validateAndProcessFile = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !(fileExtension === 'csv' || fileExtension === 'xlsx' || fileExtension === 'xls')) {
      setFileError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }
    
    setFileError(null);
    onFileSelected(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div
        onClick={handleButtonClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "w-full max-w-xl h-64 flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all duration-300 border-2 border-dashed",
          "bg-secondary/30 hover:bg-secondary/50 group/upload",
          isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-secondary"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          className="hidden"
          data-testid="file-input"
        />
        
        <div className="flex flex-col items-center space-y-4 p-6">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
            "bg-secondary/50 group-hover/upload:bg-primary/10"
          )}>
            <UploadIcon 
              className={cn(
                "w-8 h-8 transition-all duration-300",
                isDragging ? "text-primary" : "text-muted-foreground group-hover/upload:text-primary"
              )} 
            />
          </div>
          
          <div className="flex flex-col items-center space-y-1 text-center">
            <h3 className="text-lg font-medium">
              {isDragging ? "Drop your file here" : "Drag and drop your file"}
            </h3>
            <p className="text-sm text-muted-foreground">
              or <span className="text-primary font-medium">browse</span> to select a file
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Supports CSV, Excel files (.csv, .xlsx, .xls)
            </p>
          </div>
        </div>
      </div>
      
      {fileError && (
        <div className="mt-4 flex items-center text-destructive text-sm gap-2 animate-slide-up">
          <AlertCircle className="w-4 h-4" />
          <span>{fileError}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
