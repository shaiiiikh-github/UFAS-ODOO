import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesOrderService } from '@/services/salesOrderService';
import type { SalesOrderInput, SalesOrderFilters } from '@/types/salesOrder';
import { toast } from 'sonner';

export const SALES_ORDERS_QUERY_KEY = 'salesOrders';

export const useSalesOrders = (filters?: SalesOrderFilters) => {
  return useQuery({
    queryKey: [SALES_ORDERS_QUERY_KEY, filters],
    queryFn: () => salesOrderService.getSalesOrders(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSalesOrder = (id: string) => {
  return useQuery({
    queryKey: [SALES_ORDERS_QUERY_KEY, id],
    queryFn: () => salesOrderService.getSalesOrder(id),
    enabled: !!id,
  });
};

export const useCreateSalesOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SalesOrderInput) => salesOrderService.createSalesOrder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_ORDERS_QUERY_KEY] });
      toast.success('Sales order created successfully.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create sales order.');
    },
  });
};

export const useUpdateSalesOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SalesOrderInput> }) =>
      salesOrderService.updateSalesOrder(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [SALES_ORDERS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SALES_ORDERS_QUERY_KEY, updated.id] });
      toast.success('Sales order updated successfully.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update sales order.');
    },
  });
};

export const useConfirmSalesOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesOrderService.confirmSalesOrder(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [SALES_ORDERS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SALES_ORDERS_QUERY_KEY, updated.id] });
      toast.success('Sales order confirmed.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to confirm sales order.');
    },
  });
};

export const useCancelSalesOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesOrderService.cancelSalesOrder(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [SALES_ORDERS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SALES_ORDERS_QUERY_KEY, updated.id] });
      toast.success('Sales order cancelled.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel sales order.');
    },
  });
};

export const useDeleteSalesOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesOrderService.deleteSalesOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_ORDERS_QUERY_KEY] });
      toast.success('Sales order deleted.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete sales order.');
    },
  });
};
