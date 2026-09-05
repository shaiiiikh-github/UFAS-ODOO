import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerInvoiceService } from '@/services/customerInvoiceService';
import type { CustomerInvoiceInput, CustomerInvoiceFilters } from '@/types/customerInvoice';
import { toast } from 'sonner';

export const CUSTOMER_INVOICES_QUERY_KEY = 'customerInvoices';

export const useCustomerInvoices = (filters?: CustomerInvoiceFilters) => {
  return useQuery({
    queryKey: [CUSTOMER_INVOICES_QUERY_KEY, filters],
    queryFn: () => customerInvoiceService.getInvoices(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCustomerInvoice = (id: string) => {
  return useQuery({
    queryKey: [CUSTOMER_INVOICES_QUERY_KEY, id],
    queryFn: () => customerInvoiceService.getInvoice(id),
    enabled: !!id,
  });
};

export const useCreateCustomerInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerInvoiceInput) => customerInvoiceService.createInvoice(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_INVOICES_QUERY_KEY] });
      toast.success('Invoice created successfully.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create invoice.');
    },
  });
};

export const useUpdateCustomerInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerInvoiceInput> }) =>
      customerInvoiceService.updateInvoice(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_INVOICES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_INVOICES_QUERY_KEY, updated.id] });
      toast.success('Invoice updated successfully.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update invoice.');
    },
  });
};

export const usePostCustomerInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customerInvoiceService.postInvoice(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_INVOICES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_INVOICES_QUERY_KEY, updated.id] });
      toast.success('Invoice posted.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to post invoice.');
    },
  });
};

export const useCancelCustomerInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customerInvoiceService.cancelInvoice(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_INVOICES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CUSTOMER_INVOICES_QUERY_KEY, updated.id] });
      toast.success('Invoice cancelled.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel invoice.');
    },
  });
};
