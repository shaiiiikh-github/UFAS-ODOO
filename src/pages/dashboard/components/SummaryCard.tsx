import React from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import type { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  label: string;
  amount: number;
  change?: number;
  icon: LucideIcon;
  className?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  amount,
  change,
  icon: Icon,
  className,
}) => {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive ? 'text-green-700' : 'text-red-700';

  return (
    <div className={cn('bg-white border border-[#e5e7eb] rounded-md p-4 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-[#6b7280]">{label}</div>
        <Icon className="h-4 w-4 text-[#6b7280]" />
      </div>
      <div className="mt-1">
        <div className="text-xl font-semibold text-[#1a2332]">{formatCurrency(amount)}</div>
        {change !== undefined && (
          <div className={cn('text-xs font-medium mt-0.5', changeColor)}>
            {isPositive ? '+' : ''}
            {change.toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
};