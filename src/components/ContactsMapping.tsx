
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ChevronRight, CheckIcon } from 'lucide-react';
import { 
  ContactsColumnMapping, 
  columnLabelToIndex, 
  indexToColumnLabel 
} from '@/utils/fileProcessing';

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
    
    headers.forEach((header, index) => {
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
          <div className="space-y-2">
            <Label htmlFor="mobile" className="flex items-center">
              Mobile/Phone Number <span className="text-destructive ml-1">*</span>
            </Label>
            <Select 
              value={columnMapping.mobile} 
              onValueChange={(value) => handleColumnChange('mobile', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Select a column --</SelectItem>
                {headerRow.map((header, index) => (
                  <SelectItem key={`mobile-${index}`} value={indexToColumnLabel(index)}>
                    Column {indexToColumnLabel(index)}: {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Select 
              value={columnMapping.name} 
              onValueChange={(value) => handleColumnChange('name', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Not included --</SelectItem>
                {headerRow.map((header, index) => (
                  <SelectItem key={`name-${index}`} value={indexToColumnLabel(index)}>
                    Column {indexToColumnLabel(index)}: {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Select 
              value={columnMapping.email} 
              onValueChange={(value) => handleColumnChange('email', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Not included --</SelectItem>
                {headerRow.map((header, index) => (
                  <SelectItem key={`email-${index}`} value={indexToColumnLabel(index)}>
                    Column {indexToColumnLabel(index)}: {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Birthday Field */}
          <div className="space-y-2">
            <Label htmlFor="birthday">Birthday</Label>
            <Select 
              value={columnMapping.birthday} 
              onValueChange={(value) => handleColumnChange('birthday', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Not included --</SelectItem>
                {headerRow.map((header, index) => (
                  <SelectItem key={`birthday-${index}`} value={indexToColumnLabel(index)}>
                    Column {indexToColumnLabel(index)}: {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Additional Fields (Anniversary, Gender, Points, Tags) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="anniversary">Anniversary</Label>
              <Select 
                value={columnMapping.anniversary} 
                onValueChange={(value) => handleColumnChange('anniversary', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Not included --</SelectItem>
                  {headerRow.map((header, index) => (
                    <SelectItem key={`anniversary-${index}`} value={indexToColumnLabel(index)}>
                      Column {indexToColumnLabel(index)}: {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select 
                value={columnMapping.gender} 
                onValueChange={(value) => handleColumnChange('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Not included --</SelectItem>
                  {headerRow.map((header, index) => (
                    <SelectItem key={`gender-${index}`} value={indexToColumnLabel(index)}>
                      Column {indexToColumnLabel(index)}: {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="points">Points</Label>
              <Select 
                value={columnMapping.points} 
                onValueChange={(value) => handleColumnChange('points', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Not included --</SelectItem>
                  {headerRow.map((header, index) => (
                    <SelectItem key={`points-${index}`} value={indexToColumnLabel(index)}>
                      Column {indexToColumnLabel(index)}: {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Select 
                value={columnMapping.tags} 
                onValueChange={(value) => handleColumnChange('tags', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">-- Not included --</SelectItem>
                  {headerRow.map((header, index) => (
                    <SelectItem key={`tags-${index}`} value={indexToColumnLabel(index)}>
                      Column {indexToColumnLabel(index)}: {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
