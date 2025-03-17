
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ChevronRight } from 'lucide-react';
import { 
  ContactsColumnMapping
} from '@/utils/types';
import { indexToColumnLabel } from '@/utils/columnUtils';

interface ContactsMappingProps {
  onComplete: (columnMapping: ContactsColumnMapping) => void;
  onCancel: () => void;
  rawData: any[][];
}

const ContactsMapping: React.FC<ContactsMappingProps> = ({ onComplete, onCancel, rawData }) => {
  const [columnMapping, setColumnMapping] = useState<ContactsColumnMapping>({
    mobile: '',
    name: '',
    email: '',
    birthday: '',
    anniversary: '',
    gender: '',
    points: '',
    tags: ''
  });
  const [headerRow, setHeaderRow] = useState<string[]>([]);
  
  useEffect(() => {
    if (rawData && rawData.length > 0) {
      // Get header row and convert to strings
      const headers = rawData[0].map((cell: any) => {
        return cell ? String(cell) : '';
      });
      setHeaderRow(headers);
      
      // Try to auto-detect columns
      autoDetectColumns(headers);
    }
  }, [rawData]);
  
  const autoDetectColumns = (headers: string[]) => {
    const mapping: ContactsColumnMapping = {
      mobile: '',
      name: '',
      email: '',
      birthday: '',
      anniversary: '',
      gender: '',
      points: '',
      tags: ''
    };
    
    // Only process headers if they exist
    if (headers && headers.length > 0) {
      headers.forEach((header, index) => {
        if (!header) return; // Skip empty headers
        
        const lowerHeader = header.toLowerCase();
        const columnLabel = indexToColumnLabel(index);
        
        // Detect mobile/phone number column
        if (lowerHeader.includes('mobile') || lowerHeader.includes('phone') || lowerHeader.includes('contact')) {
          mapping.mobile = columnLabel;
        }
        
        // Detect name column
        if (lowerHeader.includes('name') || lowerHeader.includes('customer')) {
          mapping.name = columnLabel;
        }
        
        // Detect email column
        if (lowerHeader.includes('email') || lowerHeader.includes('mail')) {
          mapping.email = columnLabel;
        }
        
        // Detect birthday column
        if (lowerHeader.includes('birth') || lowerHeader.includes('dob') || lowerHeader === 'bday') {
          mapping.birthday = columnLabel;
        }
        
        // Detect anniversary column
        if (lowerHeader.includes('anniv') || lowerHeader.includes('anniversary')) {
          mapping.anniversary = columnLabel;
        }
        
        // Detect gender column
        if (lowerHeader.includes('gender') || lowerHeader.includes('sex')) {
          mapping.gender = columnLabel;
        }
        
        // Detect points column
        if (lowerHeader.includes('point') || lowerHeader.includes('score')) {
          mapping.points = columnLabel;
        }
        
        // Detect tags column
        if (lowerHeader.includes('tag') || lowerHeader.includes('category')) {
          mapping.tags = columnLabel;
        }
      });
    }
    
    setColumnMapping(mapping);
  };
  
  const handleColumnChange = (field: keyof ContactsColumnMapping, value: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure mobile column is mapped
    if (columnMapping.mobile) {
      onComplete(columnMapping);
    }
  };

  const renderColumnSelector = (
    field: keyof ContactsColumnMapping,
    label: string,
    required: boolean = false
  ) => {
    return (
      <div className="space-y-2">
        <Label htmlFor={field} className="flex items-center">
          {label} {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Select 
          value={columnMapping[field]} 
          onValueChange={(value) => handleColumnChange(field, value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select column ${required ? '' : '(optional)'}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">-- Not included --</SelectItem>
            {headerRow.map((header, index) => (
              header ? (
                <SelectItem key={`${field}-${index}`} value={indexToColumnLabel(index)}>
                  Column {indexToColumnLabel(index)}: {header || '[Empty]'}
                </SelectItem>
              ) : null
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };
  
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-white glass rounded-xl p-8 transition-all duration-300 animate-scale-in">
        <h2 className="text-2xl font-semibold mb-2">Map Contacts Data Columns</h2>
        <p className="text-muted-foreground mb-6">
          Please identify which columns in your data contain contact information. 
          Only the Mobile/Phone column is required.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mobile/Phone Number Field (Required) */}
          {renderColumnSelector('mobile', 'Mobile/Phone Number', true)}
          
          {/* Name Field */}
          {renderColumnSelector('name', 'Name')}
          
          {/* Email Field */}
          {renderColumnSelector('email', 'Email')}
          
          {/* Birthday Field */}
          {renderColumnSelector('birthday', 'Birthday')}
          
          {/* Additional Fields (Anniversary, Gender, Points, Tags) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Anniversary Field */}
            {renderColumnSelector('anniversary', 'Anniversary')}
            
            {/* Gender Field */}
            {renderColumnSelector('gender', 'Gender')}
            
            {/* Points Field */}
            {renderColumnSelector('points', 'Points')}
            
            {/* Tags Field */}
            {renderColumnSelector('tags', 'Tags')}
          </div>
          
          <div className="flex justify-between pt-4">
            <Button 
              type="button"
              variant="outline" 
              onClick={onCancel}
            >
              Skip Contacts File
            </Button>
            
            <Button 
              type="submit"
              disabled={!columnMapping.mobile}
              className="group"
            >
              Generate Contacts File
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactsMapping;
