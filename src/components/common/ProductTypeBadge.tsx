import React from 'react';
import type { ProductType } from '@/types/product';
import { cn } from '@/lib/utils';

const typeConfig: Record<ProductType, { label: string; className: string }> = {
  goods: { label: 'Goods', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  service: { label: 'Service', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  combo: { label: 'Combo', className: 'bg-green-50 text-green-700 border-green-200' },
};

export const ProductTypeBadge: React.FC<{ type: ProductType; className?: string }> = ({ type, className }) => {
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