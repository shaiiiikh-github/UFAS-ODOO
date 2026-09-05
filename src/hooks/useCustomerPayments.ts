import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerPaymentService } from '@/services/customerPaymentService';
import type {
  CustomerPaymentInput,
  CustomerPaymentFilters,
} from '@/types/customerPayment';
import { toast } from 'sonner';

export const CUSTOMER_PAYMENTS_QUERY_KEY = 'customerPayments';
export const ELIGIBLE_INVOICES_QUERY_KEY = 'eligibleInvoices';

export const useCustomerPayments = (filters?: CustomerPaymentFilters) => {
  return useQuery({
    queryKey: [CUSTOMER_PAYMENTS_QUERY_KEY, filters],
    queryFn: () => customerPaymentService.getPayments(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCustomerPayment = (id: string) => {
  return useQuery({
    queryKey: [CUSTOMER_PAYMENTS_QUERY_KEY, id],
    queryFn: () => customerPaymentService.getPayment(id),
    enabled: !!id,
  });
};

export const useEligibleInvoices = () => {
  return useQuery({
    queryKey: [ELIGIBLE_INVOICES_QUERY_KEY],
    queryFn: () => customerPaymentService.getEligibleInvoices(),
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateCustomerPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerPaymentInput) => customerPaymentService.createPayment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_PAYMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ELIGIBLE_INVOICES_QUERY_KEY] });
      toast.success('Payment recorded successfully.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record payment.');
    },
  });
};

export const useUpdateCustomerPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerPaymentInput> }) =>
      customerPaymentService.updatePayment(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_PAYMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_PAYMENTS_QUERY_KEY, updated.id] });
      queryClient.invalidateQueries({ queryKey: [ELIGIBLE_INVOICES_QUERY_KEY] });
      toast.success('Payment updated successfully.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update payment.');
    },
  });
};

export const usePostCustomerPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customerPaymentService.postPayment(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_PAYMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_PAYMENTS_QUERY_KEY, updated.id] });
      queryClient.invalidateQueries({ queryKey: [ELIGIBLE_INVOICES_QUERY_KEY] });
      toast.success('Payment posted.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to post payment.');
    },
  });
};

export const useCancelCustomerPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customerPaymentService.cancelPayment(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_PAYMENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_PAYMENTS_QUERY_KEY, updated.id] });
      queryClient.invalidateQueries({ queryKey: [ELIGIBLE_INVOICES_QUERY_KEY] });
      toast.success('Payment cancelled.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel payment.');
    },
  });
};
