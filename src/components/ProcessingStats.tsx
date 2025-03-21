
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Users, AlertCircle, CheckCircle } from 'lucide-react';

interface ProcessingStatsProps {
  currentStats?: {
    totalFiles: number;
    totalRecords: number;
    validRecords: number;
    rejectedRecords: number;
  };
}

const ProcessingStats: React.FC<ProcessingStatsProps> = ({ currentStats }) => {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalRecords: 0,
    validRecords: 0,
    rejectedRecords: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    // If we have current stats from a recent processing operation, add them to the totals
    if (currentStats) {
      setStats(prevStats => ({
        totalFiles: prevStats.totalFiles + currentStats.totalFiles,
        totalRecords: prevStats.totalRecords + currentStats.totalRecords,
        validRecords: prevStats.validRecords + currentStats.validRecords,
        rejectedRecords: prevStats.rejectedRecords + currentStats.rejectedRecords,
      }));
    }
  }, [currentStats]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('processed_files')
        .select('total_records, valid_records, rejected_records');
      
      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }
      
      if (data) {
        const totals = data.reduce((acc, file) => {
          return {
            totalRecords: acc.totalRecords + (file.total_records || 0),
            validRecords: acc.validRecords + (file.valid_records || 0),
            rejectedRecords: acc.rejectedRecords + (file.rejected_records || 0),
          };
        }, { totalRecords: 0, validRecords: 0, rejectedRecords: 0 });
        
        setStats({
          totalFiles: data.length,
          ...totals
        });
      }
    } catch (error) {
      console.error('Error calculating stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full py-4 animate-pulse space-y-2">
        <div className="h-5 bg-muted rounded w-1/4"></div>
        <div className="h-10 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <Card className="shadow-sm border-0 reelo-card overflow-hidden">
      <CardHeader className="pb-2 bg-secondary">
        <CardTitle className="text-lg font-semibold text-foreground">Processing Statistics</CardTitle>
        <CardDescription>Summary of all data processed by the application</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex flex-col space-y-2">
            <div className="text-sm text-muted-foreground flex items-center">
              <FileText className="h-4 w-4 mr-1 text-primary" />
              Total Files
            </div>
            <div className="text-2xl font-bold">{stats.totalFiles}</div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="text-sm text-muted-foreground flex items-center">
              <Users className="h-4 w-4 mr-1 text-primary" />
              Total Records
            </div>
            <div className="text-2xl font-bold">{stats.totalRecords}</div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="text-sm text-muted-foreground flex items-center">
              <CheckCircle className="h-4 w-4 mr-1 text-primary" />
              Valid Records
            </div>
            <div className="text-2xl font-bold">{stats.validRecords}</div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="text-sm text-muted-foreground flex items-center">
              <AlertCircle className="h-4 w-4 mr-1 text-primary" />
              Rejected Records
            </div>
            <div className="text-2xl font-bold">{stats.rejectedRecords}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingStats;
