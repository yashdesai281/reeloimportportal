
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, FileIcon, Clock, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProcessedFile {
  id: string;
  file_name: string;
  original_file_name: string;
  created_at: string;
  column_mapping: any;
}

const ProcessingHistory: React.FC = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProcessedFiles();
  }, []);

  const fetchProcessedFiles = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('processed_files')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching processed files:', error);
      toast({
        variant: "destructive",
        title: "Error loading history",
        description: "Could not load your processing history",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="bg-muted/30 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
          <FileIcon className="text-muted-foreground h-6 w-6" />
        </div>
        <h3 className="font-medium">No processing history yet</h3>
        <p className="text-sm text-muted-foreground">
          Processed files will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Processing History</h3>
      <div className="rounded-lg border overflow-hidden">
        <div className="divide-y">
          {files.map((file) => (
            <div key={file.id} className="p-4 bg-card">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="font-medium">{file.original_file_name}</div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    <span>{formatDate(file.created_at)}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProcessingHistory;
