
import React from 'react';
import ReeloLogo from '@/components/ReeloLogo';
import DashboardFlow from '@/components/DashboardFlow';
import { ErrorBoundary } from '@/components/ErrorHandler';
import { useDashboardLogic } from '@/hooks/useDashboardLogic';

const Index = () => {
  const dashboardLogic = useDashboardLogic();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-secondary/30 flex flex-col items-center px-4">
      <header className="w-full py-8 text-center">
        <div className="max-w-4xl mx-auto">
          <ReeloLogo className="mx-auto mb-6" />
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
        <ErrorBoundary>
          <DashboardFlow {...dashboardLogic} />
        </ErrorBoundary>
      </main>

      <footer className="w-full py-6 border-t bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <ReeloLogo width={30} height={30} />
          <span>Transaction File Import Portal — Process your transaction data with ease.</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
