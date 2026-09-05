import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardErrorProps {
  onRetry: () => void;
}

export const DashboardError: React.FC<DashboardErrorProps> = ({ onRetry }) => {
  return (
    <div className="bg-white border border-red-200 rounded-md p-6 text-center max-w-md mx-auto">
      <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
      <h3 className="text-sm font-medium text-[#1a2332]">Unable to load dashboard data</h3>
      <p className="text-sm text-[#6b7280] mt-1">Please try again or contact support.</p>
      <Button
        onClick={onRetry}
        className="mt-4 bg-[#1a2a3a] hover:bg-[#2a3f56] text-white"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Try again
      </Button>
    </div>
  );
};