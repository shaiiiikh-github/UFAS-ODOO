import type { VendorBill, VendorBillFilters, VendorBillInput } from '@/types/vendorBill';
import { ApiError, num } from '@/lib/api';
import { fetchDocuments, createDocument, updateDocument, cancelDocument, confirmDocument, lineToItem, itemToForm, billStatus, numberFor, type BackendDoc, type FormItem } from '@/lib/documents';

function toBill(d: BackendDoc): VendorBill {
  return {
    id: d.id,
    billNumber: numberFor('BILL', d.id),
    billDate: d.date,
    dueDate: d.due_date ?? undefined,
    purchaseOrderId: d.source_document_id ?? undefined,
    purchaseOrderNumber: d.source_document_id ? numberFor('PO', d.source_document_id) : undefined,
    vendorId: d.contact_id,
    vendorName: d.contact_name ?? undefined,
    status: billStatus(d.status),
    items: d.lines.map(lineToItem),
    subtotal: num(d.subtotal),
    taxAmount: num(d.tax_amount),
    totalAmount: num(d.total),
    paidAmount: num(d.amount_paid),
    balanceDue: num(d.outstanding_amount),
    notes: undefined,
  };
}

export const vendorBillService = {
  async getVendorBills(filters?: VendorBillFilters): Promise<VendorBill[]> {
    let result = (await fetchDocuments()).filter((d) => d.type === 'Vendor Bill').map(toBill);
    const search = filters?.search?.toLowerCase();
    if (search) result = result.filter((b) => b.billNumber.toLowerCase().includes(search) || (b.vendorName?.toLowerCase().includes(search) ?? false));
    if (filters?.status && filters.status !== 'ALL') result = result.filter((b) => b.status === filters.status);
    if (filters?.vendorId) result = result.filter((b) => b.vendorId === filters.vendorId);
    if (filters?.fromDate) result = result.filter((b) => b.billDate >= filters.fromDate!);
    if (filters?.toDate) result = result.filter((b) => b.billDate <= filters.toDate!);
    return result;
  },
  async getVendorBill(id: string): Promise<VendorBill | undefined> {
    return (await vendorBillService.getVendorBills()).find((b) => b.id === id);
  },
  async createVendorBill(input: VendorBillInput): Promise<VendorBill> {
    return toBill(await createDocument(input.vendorId, 'Vendor Bill', input.billDate, input.items as FormItem[], input.dueDate));
  },
  async updateVendorBill(id: string, input: Partial<VendorBillInput>): Promise<VendorBill> {
    const current = await vendorBillService.getVendorBill(id);
    if (!current) throw new ApiError(404, 'Vendor bill not found.');
    const items = (input.items as FormItem[]) ?? current.items.map(itemToForm);
    return toBill(await updateDocument(id, input.vendorId ?? current.vendorId, input.billDate ?? current.billDate, items, input.dueDate ?? current.dueDate));
  },
  // "Post" a bill = confirm it (posts the balanced journal entry).
  async postVendorBill(id: string): Promise<VendorBill> {
    return toBill(await confirmDocument(id));
  },
  async cancelVendorBill(id: string): Promise<VendorBill> {
    return toBill(await cancelDocument(id));
  },
  // Bills that can still receive a payment (used by the vendor payment form).
  async getPayableVendorBills(): Promise<VendorBill[]> {
    return (await vendorBillService.getVendorBills()).filter(
      (b) => (b.status === 'Posted' || b.status === 'Partially Paid') && b.balanceDue > 0,
    );
  },
};
