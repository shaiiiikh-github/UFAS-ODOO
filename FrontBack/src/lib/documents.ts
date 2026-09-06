// Shared translation layer between the backend's single TransactionDocument model
// and the frontend's separate order/bill/invoice/payment entities.
import { api, num, ApiError } from '@/lib/api';
import { journalService } from '@/services/journalService';

export type BackendDocType = 'Purchase Order' | 'Vendor Bill' | 'Sales Order' | 'Customer Invoice';
export type BackendDocStatus = 'Draft' | 'Confirmed' | 'Partially Paid' | 'Paid' | 'Cancelled';

export interface BackendDocLine {
  id: string;
  product_id: string;
  product_name: string | null;
  quantity: number;
  unit_price: number | string;
  tax_rate: number | string;
  subtotal: number | string;
  analytic_account_id: string | null;
}
export interface BackendDoc {
  id: string;
  contact_id: string;
  contact_name: string | null;
  type: BackendDocType;
  status: BackendDocStatus;
  date: string;
  due_date: string | null;
  source_document_id: string | null;
  subtotal: number | string;
  tax_amount: number | string;
  total: number | string;
  amount_paid: number | string;
  outstanding_amount: number | string;
  journal_entry_id: string | null;
  lines: BackendDocLine[];
}

export interface MappedItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // fraction, e.g. 0.18
  lineTotal: number; // incl. tax
}

export interface FormItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // fraction
}

function linesPayload(items: FormItem[]) {
  return items.map((it) => ({
    product_id: it.productId,
    quantity: it.quantity,
    unit_price: it.unitPrice,
    tax_rate: (it.taxRate || 0) * 100, // frontend fraction -> backend percent
  }));
}

export async function fetchDocuments(): Promise<BackendDoc[]> {
  return api.get<BackendDoc[]>('/api/documents/');
}

export function createDocument(contactId: string, type: BackendDocType, date: string, items: FormItem[], dueDate?: string): Promise<BackendDoc> {
  return api.post<BackendDoc>('/api/documents/', {
    contact_id: contactId,
    type,
    date,
    due_date: dueDate ?? null,
    lines: linesPayload(items),
  });
}

// Edit a DRAFT document (header + full line replacement).
export function updateDocument(id: string, contactId: string, date: string, items: FormItem[], dueDate?: string): Promise<BackendDoc> {
  return api.put<BackendDoc>(`/api/documents/${id}`, {
    contact_id: contactId,
    date,
    due_date: dueDate ?? null,
    lines: linesPayload(items),
  });
}

export function cancelDocument(id: string): Promise<BackendDoc> {
  return api.post<BackendDoc>(`/api/documents/${id}/cancel`);
}

export function deleteDocument(id: string): Promise<void> {
  return api.del<void>(`/api/documents/${id}`);
}

export function convertDocument(id: string): Promise<BackendDoc> {
  return api.post<BackendDoc>(`/api/documents/${id}/convert`);
}

export function confirmDocument(id: string): Promise<BackendDoc> {
  return api.post<BackendDoc>(`/api/documents/${id}/confirm`);
}

export function lineToItem(line: BackendDocLine): MappedItem {
  const taxRate = num(line.tax_rate) / 100;
  const sub = num(line.subtotal);
  return {
    id: line.id,
    productId: line.product_id,
    productName: line.product_name ?? '',
    quantity: line.quantity,
    unitPrice: num(line.unit_price),
    taxRate,
    lineTotal: Math.round(sub * (1 + taxRate) * 100) / 100,
  };
}

// A line item (from a fetched document/entity) back into a FormItem for edit/replace.
export function itemToForm(it: { productId: string; productName?: string; quantity: number; unitPrice: number; taxRate: number }): FormItem {
  return { productId: it.productId, productName: it.productName, quantity: it.quantity, unitPrice: it.unitPrice, taxRate: it.taxRate };
}

// Order-type entities (PO / SO): backend Confirmed -> frontend Confirmed.
export function orderStatus(s: BackendDocStatus): 'Draft' | 'Confirmed' | 'Cancelled' {
  if (s === 'Draft') return 'Draft';
  if (s === 'Cancelled') return 'Cancelled';
  return 'Confirmed';
}

// Bill/Invoice entities: backend Confirmed -> frontend Posted.
export function billStatus(s: BackendDocStatus): 'Draft' | 'Posted' | 'Partially Paid' | 'Paid' | 'Cancelled' {
  if (s === 'Draft') return 'Draft';
  if (s === 'Confirmed') return 'Posted';
  return s; // 'Partially Paid' | 'Paid' | 'Cancelled'
}

// Backend has no human-readable numbers; synthesize a stable one from the id.
export function numberFor(prefix: string, id: string): string {
  return `${prefix}-${id.slice(0, 8).toUpperCase()}`;
}

// Resolve a Cash/Bank journal id for a payment. Non-cash methods route to Bank.
export async function resolvePaymentJournalId(method: string): Promise<string> {
  const journals = await journalService.getJournals();
  const wantCash = method === 'Cash';
  const match = journals.find((j) => j.type === (wantCash ? 'cash' : 'bank'));
  const fallback = journals.find((j) => j.type === 'bank' || j.type === 'cash');
  const chosen = match ?? fallback;
  if (!chosen) throw new ApiError(400, 'No Cash or Bank journal exists. Create one under Master Data > Journals first.');
  return chosen.id;
}
