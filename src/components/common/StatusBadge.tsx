import React from 'react';
import { cn } from '@/lib/utils';

type Status =
  | 'draft'
  | 'confirmed'
  | 'pending'
  | 'paid'
  | 'partially paid'
  | 'overdue'
  | 'cancelled'
  | 'posted'
  | 'active'
  | 'inactive';

const VARIANT_MAP: Record<Status, string> = {
  draft: 'bg-[#f3f4f6] text-[#4b5563]',
  confirmed: 'bg-[#e0f2fe] text-[#0369a1]',
  pending: 'bg-[#fef3c7] text-[#b45309]',
  paid: 'bg-[#d1fae5] text-[#065f46]',
  'partially paid': 'bg-[#fef3c7] text-[#b45309]',
  overdue: 'bg-[#fee2e2] text-[#b91c1c]',
  cancelled: 'bg-[#f3f4f6] text-[#4b5563]',
  posted: 'bg-[#d1fae5] text-[#065f46]',
  active: 'bg-[#d1fae5] text-[#065f46]',
  inactive: 'bg-[#f3f4f6] text-[#4b5563]',
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const variant = VARIANT_MAP[status] || 'bg-gray-100 text-gray-700';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
        variant,
        className
      )}
    >
      {status}
    </span>
  );
};