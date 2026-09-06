import type { CustomerPayment, CustomerPaymentFilters, CustomerPaymentInput, CustomerPaymentStatus, PaymentMethod } from '@/types/customerPayment';
import type { CustomerInvoice } from '@/types/customerInvoice';
import { api, ApiError, num } from '@/lib/api';
import { fetchDocuments, numberFor, resolvePaymentJournalId, type BackendDoc } from '@/lib/documents';
import { customerInvoiceService } from '@/services/customerInvoiceService';
import { journalService } from '@/services/journalService';

interface BackendPayment {
  id: string;
  document_id: string;
  journal_id: string;
  journal_entry_id: string | null;
  payment_date: string;
  amount: number | string;
  reference: string;
  provider: string;
  status: string;
  method: string | null;
}

async function methodByJournal(): Promise<Map<string, PaymentMethod>> {
  const journals = await journalService.getJournals();
  return new Map(journals.map((j) => [j.id, (j.type === 'cash' ? 'Cash' : 'Bank') as PaymentMethod]));
}

export const customerPaymentService = {
  getPayments: async (filters?: CustomerPaymentFilters): Promise<CustomerPayment[]> => {
    const [payments, docs, methodMap] = await Promise.all([
      api.get<BackendPayment[]>('/api/payments/'),
      fetchDocuments(),
      methodByJournal(),
    ]);
    const docById = new Map<string, BackendDoc>(docs.map((d) => [d.id, d]));
    let result: CustomerPayment[] = payments
      .map((p) => ({ p, doc: docById.get(p.document_id) }))
      .filter((x): x is { p: BackendPayment; doc: BackendDoc } => !!x.doc && x.doc.type === 'Customer Invoice')
      .map(({ p, doc }) => ({
        id: p.id,
        paymentNumber: numberFor('PAY', p.id),
        paymentDate: p.payment_date,
        customerId: doc.contact_id,
        customerName: doc.contact_name ?? undefined,
        customerInvoiceId: doc.id,
        invoiceNumber: numberFor('INV', doc.id),
        amount: num(p.amount),
        paymentMethod: (p.method as PaymentMethod) ?? methodMap.get(p.journal_id) ?? 'Bank',
        reference: p.reference,
        notes: undefined,
        status: (p.status as CustomerPaymentStatus) || 'Posted',
      }));

    const search = filters?.search?.toLowerCase();
    if (search) result = result.filter((p) => p.paymentNumber.toLowerCase().includes(search) || (p.customerName?.toLowerCase().includes(search) ?? false) || (p.invoiceNumber?.toLowerCase().includes(search) ?? false) || (p.reference?.toLowerCase().includes(search) ?? false));
    if (filters?.status && filters.status !== 'ALL') result = result.filter((p) => p.status === filters.status);
    if (filters?.customerId) result = result.filter((p) => p.customerId === filters.customerId);
    if (filters?.paymentMethod && filters.paymentMethod !== 'ALL') result = result.filter((p) => p.paymentMethod === filters.paymentMethod);
    if (filters?.fromDate) result = result.filter((p) => p.paymentDate >= filters.fromDate!);
    if (filters?.toDate) result = result.filter((p) => p.paymentDate <= filters.toDate!);
    return result;
  },

  getPayment: async (id: string): Promise<CustomerPayment | undefined> => (await customerPaymentService.getPayments()).find((p) => p.id === id),

  getEligibleInvoices: async (): Promise<CustomerInvoice[]> =>
    (await customerInvoiceService.getInvoices()).filter((i) => (i.status === 'Posted' || i.status === 'Partially Paid') && i.balanceDue > 0),

  // Create a DRAFT payment. It affects the ledger only after postPayment.
  createPayment: async (input: CustomerPaymentInput): Promise<CustomerPayment> => {
    const journalId = await resolvePaymentJournalId(input.paymentMethod);
    const draft = await api.post<BackendPayment>('/api/payments/', {
      document_id: input.customerInvoiceId,
      journal_id: journalId,
      payment_date: input.paymentDate,
      amount: input.amount,
      reference: input.reference || '',
      method: input.paymentMethod,
    });
    return {
      id: draft.id,
      paymentNumber: numberFor('PAY', draft.id),
      paymentDate: draft.payment_date,
      customerId: input.customerId,
      customerName: undefined,
      customerInvoiceId: input.customerInvoiceId,
      invoiceNumber: numberFor('INV', input.customerInvoiceId),
      amount: num(draft.amount),
      paymentMethod: (draft.method as PaymentMethod) ?? input.paymentMethod,
      reference: draft.reference,
      notes: input.notes || '',
      status: (draft.status as CustomerPaymentStatus) || 'Draft',
    };
  },

  updatePayment: async (id: string, data: Partial<CustomerPaymentInput>): Promise<CustomerPayment> => {
    const current = await customerPaymentService.getPayment(id);
    if (!current) throw new ApiError(404, 'Payment not found.');
    const method = data.paymentMethod ?? current.paymentMethod;
    const journalId = await resolvePaymentJournalId(method);
    const updated = await api.put<BackendPayment>(`/api/payments/${id}`, {
      journal_id: journalId,
      payment_date: data.paymentDate ?? current.paymentDate,
      amount: data.amount ?? current.amount,
      reference: (data.reference ?? current.reference) || '',
      method,
    });
    return {
      ...current,
      paymentDate: updated.payment_date,
      amount: num(updated.amount),
      paymentMethod: (updated.method as PaymentMethod) ?? method,
      reference: updated.reference,
      notes: data.notes ?? current.notes,
      status: (updated.status as CustomerPaymentStatus) || current.status,
    };
  },

  postPayment: async (id: string): Promise<CustomerPayment> => {
    await api.post<BackendPayment>(`/api/payments/${id}/post`);
    const p = await customerPaymentService.getPayment(id);
    if (!p) throw new ApiError(404, 'Payment not found after posting.');
    return p;
  },

  cancelPayment: async (id: string): Promise<CustomerPayment> => {
    await api.post<BackendPayment>(`/api/payments/${id}/cancel`);
    const p = await customerPaymentService.getPayment(id);
    if (!p) throw new ApiError(404, 'Payment not found after cancelling.');
    return p;
  },
};
