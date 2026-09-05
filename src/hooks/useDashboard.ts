import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import type { DashboardData } from '@/types/dashboard';

export const useDashboard = (dateRange: string) => {
  return useQuery<DashboardData>({
    queryKey: ['dashboard', dateRange],
    queryFn: () => dashboardService.getDashboardData(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};