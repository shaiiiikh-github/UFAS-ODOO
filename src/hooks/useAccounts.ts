import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '@/services/accountService';
import type { AccountInput, AccountFilters } from '@/types/account';
import { toast } from 'sonner';

export const ACCOUNTS_QUERY_KEY = 'accounts';

export const useAccounts = (filters?: AccountFilters) => {
  return useQuery({
    queryKey: [ACCOUNTS_QUERY_KEY, filters],
    queryFn: () => accountService.getAccounts(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useAccount = (id: string) => {
  return useQuery({
    queryKey: [ACCOUNTS_QUERY_KEY, id],
    queryFn: () => accountService.getAccount(id),
    enabled: !!id,
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AccountInput) => accountService.createAccount(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY] });
      toast.success('Account created successfully.');
    },
    onError: () => {
      toast.error('Failed to create account.');
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AccountInput> }) =>
      accountService.updateAccount(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY, updated.id] });
      toast.success('Account updated successfully.');
    },
    onError: () => {
      toast.error('Failed to update account.');
    },
  });
};
