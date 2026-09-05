import React from 'react';
import type { ContactType } from '@/types/contact';
import { cn } from '@/lib/utils';

interface ContactTypeBadgeProps {
  type: ContactType;
  className?: string;
}

const typeConfig: Record<ContactType, { label: string; className: string }> = {
  CUSTOMER: {
    label: 'Customer',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  VENDOR: {
    label: 'Vendor',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  BOTH: {
    label: 'Both',
    className: 'bg-green-50 text-green-700 border-green-200',
  },
};

export const ContactTypeBadge: React.FC<ContactTypeBadgeProps> = ({ type, className }) => {
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