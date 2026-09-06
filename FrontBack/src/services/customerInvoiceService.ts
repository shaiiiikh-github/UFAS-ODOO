import type { CustomerInvoice, CustomerInvoiceFilters, CustomerInvoiceInput } from '@/types/customerInvoice';
import { ApiError, num } from '@/lib/api';
import { fetchDocuments, createDocument, updateDocument, cancelDocument, confirmDocument, lineToItem, itemToForm, billStatus, numberFor, type BackendDoc, type FormItem } from '@/lib/documents';

export function docToInvoice(d: BackendDoc): CustomerInvoice {
  return {
    id: d.id,
    invoiceNumber: numberFor('INV', d.id),
    invoiceDate: d.date,
    dueDate: d.due_date ?? undefined,
    salesOrderId: d.source_document_id ?? undefined,
    salesOrderNumber: d.source_document_id ? numberFor('SO', d.source_document_id) : undefined,
    customerId: d.contact_id,
    customerName: d.contact_name ?? undefined,
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

export const customerInvoiceService = {
  getInvoices: async (filters?: CustomerInvoiceFilters): Promise<CustomerInvoice[]> => {
    let result = (await fetchDocuments()).filter((d) => d.type === 'Customer Invoice').map(docToInvoice);
    const search = filters?.search?.toLowerCase();
    if (search) result = result.filter((i) => i.invoiceNumber.toLowerCase().includes(search) || (i.customerName?.toLowerCase().includes(search) ?? false));
    if (filters?.status && filters.status !== 'ALL') result = result.filter((i) => i.status === filters.status);
    if (filters?.customerId) result = result.filter((i) => i.customerId === filters.customerId);
    if (filters?.fromDate) result = result.filter((i) => i.invoiceDate >= filters.fromDate!);
    if (filters?.toDate) result = result.filter((i) => i.invoiceDate <= filters.toDate!);
    return result;
  },
  getInvoice: async (id: string): Promise<CustomerInvoice | undefined> => (await customerInvoiceService.getInvoices()).find((i) => i.id === id),
  createInvoice: async (input: CustomerInvoiceInput): Promise<CustomerInvoice> =>
    docToInvoice(await createDocument(input.customerId, 'Customer Invoice', input.invoiceDate, input.items as FormItem[], input.dueDate)),
  updateInvoice: async (id: string, data: Partial<CustomerInvoiceInput>): Promise<CustomerInvoice> => {
    const current = await customerInvoiceService.getInvoice(id);
    if (!current) throw new ApiError(404, 'Invoice not found.');
    const items = (data.items as FormItem[]) ?? current.items.map(itemToForm);
    return docToInvoice(await updateDocument(id, data.customerId ?? current.customerId, data.invoiceDate ?? current.invoiceDate, items, data.dueDate ?? current.dueDate));
  },
  // "Post" an invoice = confirm it (posts the balanced journal entry).
  postInvoice: async (id: string): Promise<CustomerInvoice> => docToInvoice(await confirmDocument(id)),
  cancelInvoice: async (id: string): Promise<CustomerInvoice> => docToInvoice(await cancelDocument(id)),
};
