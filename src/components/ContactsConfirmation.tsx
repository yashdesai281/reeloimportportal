
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileCheck, FileX } from 'lucide-react';

interface ContactsConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const ContactsConfirmation: React.FC<ContactsConfirmationProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-white glass rounded-xl p-8 transition-all duration-300 animate-scale-in">
        <h2 className="text-2xl font-semibold mb-2">Generate Contacts File?</h2>
        <p className="text-muted-foreground mb-6">
          Would you like to generate a contacts file from your data? This will create a cleaned list of contacts with duplicates removed.
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border rounded-lg p-4 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <FileCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium text-center">Transaction File</h3>
            <p className="text-xs text-center text-muted-foreground mt-1">Already generated</p>
          </div>
          
          <div className="border rounded-lg p-4 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mb-3">
              <FileCheck className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-center">Contacts File</h3>
            <p className="text-xs text-center text-muted-foreground mt-1">Generate cleaned contacts list</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={onConfirm}
            className="flex-1"
          >
            Yes, Generate Contacts File
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
          >
            No, Skip This Step
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContactsConfirmation;
