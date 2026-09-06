import type { PurchaseOrder, PurchaseOrderFilters, PurchaseOrderInput } from '@/types/purchaseOrder';
import { ApiError, num } from '@/lib/api';
import { fetchDocuments, createDocument, updateDocument, cancelDocument, deleteDocument, convertDocument, lineToItem, itemToForm, orderStatus, numberFor, type BackendDoc, type FormItem } from '@/lib/documents';

function toOrder(d: BackendDoc): PurchaseOrder {
  return {
    id: d.id,
    orderNumber: numberFor('PO', d.id),
    orderDate: d.date,
    vendorId: d.contact_id,
    vendorName: d.contact_name ?? undefined,
    status: orderStatus(d.status),
    items: d.lines.map(lineToItem),
    subtotal: num(d.subtotal),
    taxAmount: num(d.tax_amount),
    totalAmount: num(d.total),
    notes: undefined,
  };
}

export const purchaseOrderService = {
  async getPurchaseOrders(filters?: PurchaseOrderFilters): Promise<PurchaseOrder[]> {
    let result = (await fetchDocuments()).filter((d) => d.type === 'Purchase Order').map(toOrder);
    const search = filters?.search?.toLowerCase();
    if (search) result = result.filter((o) => o.orderNumber.toLowerCase().includes(search) || (o.vendorName?.toLowerCase().includes(search) ?? false));
    if (filters?.status && filters.status !== 'ALL') result = result.filter((o) => o.status === filters.status);
    if (filters?.vendorId) result = result.filter((o) => o.vendorId === filters.vendorId);
    if (filters?.fromDate) result = result.filter((o) => o.orderDate >= filters.fromDate!);
    if (filters?.toDate) result = result.filter((o) => o.orderDate <= filters.toDate!);
    return result;
  },
  async getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> {
    return (await purchaseOrderService.getPurchaseOrders()).find((o) => o.id === id);
  },
  async createPurchaseOrder(input: PurchaseOrderInput): Promise<PurchaseOrder> {
    return toOrder(await createDocument(input.vendorId, 'Purchase Order', input.orderDate, input.items as FormItem[]));
  },
  async updatePurchaseOrder(id: string, input: Partial<PurchaseOrderInput>): Promise<PurchaseOrder> {
    const current = await purchaseOrderService.getPurchaseOrder(id);
    if (!current) throw new ApiError(404, 'Purchase order not found.');
    const items = (input.items as FormItem[]) ?? current.items.map(itemToForm);
    return toOrder(await updateDocument(id, input.vendorId ?? current.vendorId, input.orderDate ?? current.orderDate, items));
  },
  // "Confirm" a PO = convert it to a Vendor Bill (backend lifecycle). The PO becomes Confirmed.
  async confirmPurchaseOrder(id: string): Promise<PurchaseOrder> {
    await convertDocument(id);
    const updated = await purchaseOrderService.getPurchaseOrder(id);
    if (!updated) throw new ApiError(404, 'Purchase order not found after conversion.');
    return updated;
  },
  async cancelPurchaseOrder(id: string): Promise<PurchaseOrder> {
    return toOrder(await cancelDocument(id));
  },
  async deletePurchaseOrder(id: string): Promise<void> {
    await deleteDocument(id);
  },
};
