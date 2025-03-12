
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronRight, ChevronLeft, ArrowRight, CheckIcon } from 'lucide-react';

interface ColumnMappingProps {
  step: number;
  onComplete: (columnMapping: Record<string, number>) => void;
  onBack: () => void;
}

const mappingSteps = [
  { id: 'mobile', label: 'Mobile Number', description: 'Enter the column number containing mobile numbers' },
  { id: 'bill_number', label: 'Bill Number', description: 'Enter the column number containing bill numbers' },
  { id: 'bill_amount', label: 'Bill Amount', description: 'Enter the column number containing bill amounts' },
  { id: 'order_time', label: 'Order Time', description: 'Enter the column number containing order timestamps' },
];

const ColumnMapping: React.FC<ColumnMappingProps> = ({ step, onComplete, onBack }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [columnMappings, setColumnMappings] = useState<Record<string, number>>({});
  const [inputValue, setInputValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const currentStep = mappingSteps[currentStepIndex];

  const validateInput = (value: string): boolean => {
    if (!value.trim()) {
      setError('Please enter a column number');
      return false;
    }

    const columnNumber = parseInt(value);
    if (isNaN(columnNumber) || columnNumber <= 0) {
      setError('Please enter a valid positive number');
      return false;
    }

    // Check for duplicate mappings
    const existingMappings = Object.values(columnMappings);
    if (existingMappings.includes(columnNumber)) {
      setError('This column number is already mapped to another field');
      return false;
    }

    setError(null);
    return true;
  };

  const handleNext = () => {
    if (!validateInput(inputValue)) return;

    const columnNumber = parseInt(inputValue);
    const updatedMappings = {
      ...columnMappings,
      [currentStep.id]: columnNumber
    };

    setColumnMappings(updatedMappings);
    setInputValue('');

    if (currentStepIndex < mappingSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // Final step - complete the process
      onComplete(updatedMappings);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      // Restore previous input value
      const prevStepId = mappingSteps[currentStepIndex - 1].id;
      const prevValue = columnMappings[prevStepId];
      setInputValue(prevValue ? prevValue.toString() : '');
    } else {
      onBack();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNext();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex mb-8 justify-between">
        {mappingSteps.map((mappingStep, index) => (
          <React.Fragment key={mappingStep.id}>
            <div className="flex flex-col items-center">
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300",
                  index < currentStepIndex 
                    ? "bg-primary text-primary-foreground" 
                    : index === currentStepIndex 
                      ? "bg-primary/10 border-2 border-primary text-primary" 
                      : "bg-secondary text-muted-foreground"
                )}
              >
                {index < currentStepIndex ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className={cn(
                "text-xs transition-all duration-300",
                index === currentStepIndex ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                {mappingStep.id.replace('_', ' ')}
              </span>
            </div>
            
            {index < mappingSteps.length - 1 && (
              <div className="flex items-center">
                <div className={cn(
                  "h-0.5 w-10 transition-all duration-500",
                  index < currentStepIndex ? "bg-primary" : "bg-secondary"
                )}></div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white glass rounded-xl p-8 transition-all duration-300 animate-scale-in">
        <h2 className="text-2xl font-semibold mb-2">{currentStep.label}</h2>
        <p className="text-muted-foreground mb-6">{currentStep.description}</p>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="columnNumber">Column Number</Label>
            <Input
              id="columnNumber"
              type="number"
              min="1"
              placeholder="Enter column number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-lg h-12"
              autoFocus
            />
            {error && (
              <p className="text-destructive text-sm animate-slide-up">{error}</p>
            )}
          </div>
          
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="group"
            >
              <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back
            </Button>
            
            <Button 
              onClick={handleNext}
              className="group"
            >
              {currentStepIndex < mappingSteps.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              ) : (
                <>
                  Complete
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnMapping;
