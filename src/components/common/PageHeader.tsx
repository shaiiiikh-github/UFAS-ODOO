import React from 'react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 py-6">
      <div className="flex-1 min-w-[200px]">
        <h1 className="text-2xl font-semibold text-[#1a2332] tracking-tight">{title}</h1>
        {description && <p className="text-sm text-[#6b7280] mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
};