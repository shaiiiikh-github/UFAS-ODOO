import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticAccountService } from '@/services/analyticAccountService';
import type { AnalyticAccount, AnalyticAccountInput, AnalyticAccountFilters } from '@/types/analyticAccount';
import { toast } from 'sonner';

export const ANALYTIC_ACCOUNTS_QUERY_KEY = 'analyticAccounts';

export const useAnalyticAccounts = (filters?: AnalyticAccountFilters) => {
  return useQuery({
    queryKey: [ANALYTIC_ACCOUNTS_QUERY_KEY, filters],
    queryFn: () => analyticAccountService.getAnalyticAccounts(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useAnalyticAccount = (id: string) => {
  return useQuery({
    queryKey: [ANALYTIC_ACCOUNTS_QUERY_KEY, id],
    queryFn: () => analyticAccountService.getAnalyticAccount(id),
    enabled: !!id,
  });
};

export const useCreateAnalyticAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AnalyticAccountInput) => analyticAccountService.createAnalyticAccount(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ANALYTIC_ACCOUNTS_QUERY_KEY] });
      toast.success('Analytic account created successfully.');
    },
    onError: () => {
      toast.error('Failed to create analytic account.');
    },
  });
};

export const useUpdateAnalyticAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AnalyticAccountInput> }) =>
      analyticAccountService.updateAnalyticAccount(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [ANALYTIC_ACCOUNTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ANALYTIC_ACCOUNTS_QUERY_KEY, updated.id] });
      toast.success('Analytic account updated successfully.');
    },
    onError: () => {
      toast.error('Failed to update analytic account.');
    },
  });
};