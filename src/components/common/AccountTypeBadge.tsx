import React from 'react';
import type { AccountType } from '@/types/account';
import { cn } from '@/lib/utils';

const typeConfig: Record<AccountType, { label: string; className: string }> = {
  asset: { label: 'Asset', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  liability: { label: 'Liability', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  expense: { label: 'Expense', className: 'bg-red-50 text-red-700 border-red-200' },
  income: { label: 'Income', className: 'bg-green-50 text-green-700 border-green-200' },
  capital: { label: 'Capital', className: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export const AccountTypeBadge: React.FC<{ type: AccountType; className?: string }> = ({ type, className }) => {
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