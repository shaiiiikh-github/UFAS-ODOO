import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white border border-[#e5e7eb] rounded-md p-4 shadow-sm">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-12 mt-1" />
          </div>
        ))}
      </div>

      {/* Quick Actions and Date Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-8 w-48" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-[#e5e7eb] rounded-md p-4 h-72">
          <Skeleton className="h-5 w-36 mb-3" />
          <Skeleton className="h-52 w-full" />
        </div>
        <div className="bg-white border border-[#e5e7eb] rounded-md p-4 h-72">
          <Skeleton className="h-5 w-32 mb-3" />
          <Skeleton className="h-52 w-full" />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white border border-[#e5e7eb] rounded-md shadow-sm">
        <div className="px-4 py-3 border-b border-[#e5e7eb]">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
};