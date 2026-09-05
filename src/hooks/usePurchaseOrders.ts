import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { purchaseOrderService } from '@/services/purchaseOrderService';
import type { PurchaseOrderFilters, PurchaseOrderInput } from '@/types/purchaseOrder';

export const PURCHASE_ORDERS_QUERY_KEY = 'purchaseOrders';
export const usePurchaseOrders = (filters?: PurchaseOrderFilters) => useQuery({ queryKey: [PURCHASE_ORDERS_QUERY_KEY, filters], queryFn: () => purchaseOrderService.getPurchaseOrders(filters) });
const usePurchaseOrderMutation = <T,>(fn: (value: T) => Promise<unknown>, success: string) => {
  const client = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => { client.invalidateQueries({ queryKey: [PURCHASE_ORDERS_QUERY_KEY] }); toast.success(success); }, onError: (error: Error) => toast.error(error.message) });
};
export const useCreatePurchaseOrder = () => usePurchaseOrderMutation((input: PurchaseOrderInput) => purchaseOrderService.createPurchaseOrder(input), 'Purchase order created.');
export const useUpdatePurchaseOrder = () => usePurchaseOrderMutation(({ id, input }: { id: string; input: PurchaseOrderInput }) => purchaseOrderService.updatePurchaseOrder(id, input), 'Purchase order updated.');
export const useConfirmPurchaseOrder = () => usePurchaseOrderMutation((id: string) => purchaseOrderService.confirmPurchaseOrder(id), 'Purchase order confirmed.');
export const useCancelPurchaseOrder = () => usePurchaseOrderMutation((id: string) => purchaseOrderService.cancelPurchaseOrder(id), 'Purchase order cancelled.');
