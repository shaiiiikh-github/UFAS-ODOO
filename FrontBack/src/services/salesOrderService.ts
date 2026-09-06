import type { SalesOrder, SalesOrderFilters, SalesOrderInput } from '@/types/salesOrder';
import { ApiError, num } from '@/lib/api';
import { fetchDocuments, createDocument, updateDocument, cancelDocument, deleteDocument, convertDocument, lineToItem, itemToForm, orderStatus, numberFor, type BackendDoc, type FormItem } from '@/lib/documents';

function toOrder(d: BackendDoc): SalesOrder {
  return {
    id: d.id,
    orderNumber: numberFor('SO', d.id),
    orderDate: d.date,
    customerId: d.contact_id,
    customerName: d.contact_name ?? undefined,
    status: orderStatus(d.status),
    items: d.lines.map(lineToItem),
    subtotal: num(d.subtotal),
    taxAmount: num(d.tax_amount),
    totalAmount: num(d.total),
    notes: undefined,
  };
}

export const salesOrderService = {
  async getSalesOrders(filters?: SalesOrderFilters): Promise<SalesOrder[]> {
    let result = (await fetchDocuments()).filter((d) => d.type === 'Sales Order').map(toOrder);
    const search = filters?.search?.toLowerCase();
    if (search) result = result.filter((o) => o.orderNumber.toLowerCase().includes(search) || (o.customerName?.toLowerCase().includes(search) ?? false));
    if (filters?.status && filters.status !== 'ALL') result = result.filter((o) => o.status === filters.status);
    if (filters?.customerId) result = result.filter((o) => o.customerId === filters.customerId);
    if (filters?.fromDate) result = result.filter((o) => o.orderDate >= filters.fromDate!);
    if (filters?.toDate) result = result.filter((o) => o.orderDate <= filters.toDate!);
    return result;
  },
  async getSalesOrder(id: string): Promise<SalesOrder | undefined> {
    return (await salesOrderService.getSalesOrders()).find((o) => o.id === id);
  },
  async createSalesOrder(input: SalesOrderInput): Promise<SalesOrder> {
    return toOrder(await createDocument(input.customerId, 'Sales Order', input.orderDate, input.items as FormItem[]));
  },
  async updateSalesOrder(id: string, data: Partial<SalesOrderInput>): Promise<SalesOrder> {
    const current = await salesOrderService.getSalesOrder(id);
    if (!current) throw new ApiError(404, 'Sales order not found.');
    const items = (data.items as FormItem[]) ?? current.items.map(itemToForm);
    return toOrder(await updateDocument(id, data.customerId ?? current.customerId, data.orderDate ?? current.orderDate, items));
  },
  // "Confirm" a SO = convert it to a Customer Invoice. The SO becomes Confirmed.
  async confirmSalesOrder(id: string): Promise<SalesOrder> {
    await convertDocument(id);
    const updated = await salesOrderService.getSalesOrder(id);
    if (!updated) throw new ApiError(404, 'Sales order not found after conversion.');
    return updated;
  },
  async cancelSalesOrder(id: string): Promise<SalesOrder> {
    return toOrder(await cancelDocument(id));
  },
  async deleteSalesOrder(id: string): Promise<void> {
    await deleteDocument(id);
  },
};
