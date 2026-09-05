import React from 'react';
import type { AnalyticAccountType } from '@/types/analyticAccount';
import { cn } from '@/lib/utils';

const typeConfig: Record<AnalyticAccountType, { label: string; className: string }> = {
  income: { label: 'Income', className: 'bg-green-50 text-green-700 border-green-200' },
  expense: { label: 'Expense', className: 'bg-red-50 text-red-700 border-red-200' },
};

export const AnalyticAccountTypeBadge: React.FC<{ type: AnalyticAccountType; className?: string }> = ({ type, className }) => {
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