import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService } from '@/services/budgetService';
import type { BudgetInput, BudgetFilters } from '@/types/budget';
import { toast } from 'sonner';

export const BUDGETS_QUERY_KEY = 'budgets';

export const useBudgets = (filters?: BudgetFilters) => {
  return useQuery({
    queryKey: [BUDGETS_QUERY_KEY, filters],
    queryFn: () => budgetService.getBudgets(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useBudget = (id: string) => {
  return useQuery({
    queryKey: [BUDGETS_QUERY_KEY, id],
    queryFn: () => budgetService.getBudget(id),
    enabled: !!id,
  });
};

export const useCreateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BudgetInput) => budgetService.createBudget(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUDGETS_QUERY_KEY] });
      toast.success('Budget created successfully.');
    },
    onError: () => {
      toast.error('Failed to create budget.');
    },
  });
};

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BudgetInput> }) =>
      budgetService.updateBudget(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [BUDGETS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [BUDGETS_QUERY_KEY, updated.id] });
      toast.success('Budget updated successfully.');
    },
    onError: () => {
      toast.error('Failed to update budget.');
    },
  });
};

export const useDeleteBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => budgetService.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUDGETS_QUERY_KEY] });
      toast.success('Budget deleted.');
    },
    onError: () => {
      toast.error('Failed to delete budget.');
    },
  });
};
