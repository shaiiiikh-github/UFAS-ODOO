import React from 'react';
import type { JournalType } from '@/types/journal';
import { cn } from '@/lib/utils';

const typeConfig: Record<JournalType, { label: string; className: string }> = {
  sales: { label: 'Sales', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  purchase: { label: 'Purchase', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  bank: { label: 'Bank', className: 'bg-green-50 text-green-700 border-green-200' },
  cash: { label: 'Cash', className: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export const JournalTypeBadge: React.FC<{ type: JournalType; className?: string }> = ({ type, className }) => {
  const config = typeConfig[type];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};