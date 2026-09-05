import React from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DateRangeSelectorProps {
  value: string;
  onChange: (range: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const ranges = [
  'Today',
  'This Week',
  'This Month',
  'Last Month',
  'This Quarter',
  'This Year',
  'Custom Range',
];

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange,
  onRefresh,
  isLoading,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-white border border-[#e5e7eb] rounded-md px-3 py-1.5 pr-8 text-sm text-[#1a2332] focus:outline-none focus:ring-1 focus:ring-[#1a2a3a] cursor-pointer"
        >
          {ranges.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7280] pointer-events-none" />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        className="px-2.5 py-1.5"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};