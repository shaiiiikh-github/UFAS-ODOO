import React from 'react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="text-center py-12 px-4 max-w-sm mx-auto">
      {icon && <div className="text-[#d1d5db] mb-3">{icon}</div>}
      <h3 className="text-base font-semibold text-[#1a2332]">{title}</h3>
      {description && <p className="text-sm text-[#6b7280] mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};