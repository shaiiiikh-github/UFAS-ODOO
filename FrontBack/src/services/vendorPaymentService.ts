import type { VendorPayment, VendorPaymentFilters, VendorPaymentInput, VendorPaymentMethod, VendorPaymentStatus } from '@/types/vendorPayment';
import { api, ApiError, num } from '@/lib/api';
import { fetchDocuments, numberFor, resolvePaymentJournalId, type BackendDoc } from '@/lib/documents';
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

async function methodByJournal(): Promise<Map<string, VendorPaymentMethod>> {
  const journals = await journalService.getJournals();
  return new Map(journals.map((j) => [j.id, (j.type === 'cash' ? 'Cash' : 'Bank') as VendorPaymentMethod]));
}

export const vendorPaymentService = {
  async getVendorPayments(filters?: VendorPaymentFilters): Promise<VendorPayment[]> {
    const [payments, docs, methodMap] = await Promise.all([
      api.get<BackendPayment[]>('/api/payments/'),
      fetchDocuments(),
      methodByJournal(),
    ]);
    const docById = new Map<string, BackendDoc>(docs.map((d) => [d.id, d]));
    let result: VendorPayment[] = payments
      .map((p) => ({ p, doc: docById.get(p.document_id) }))
      .filter((x): x is { p: BackendPayment; doc: BackendDoc } => !!x.doc && x.doc.type === 'Vendor Bill')
      .map(({ p, doc }) => ({
        id: p.id,
        paymentNumber: numberFor('PAY', p.id),
        paymentDate: p.payment_date,
        vendorId: doc.contact_id,
        vendorName: doc.contact_name ?? undefined,
        vendorBillId: doc.id,
        billNumber: numberFor('BILL', doc.id),
        amount: num(p.amount),
        paymentMethod: (p.method as VendorPaymentMethod) ?? methodMap.get(p.journal_id) ?? 'Bank',
        reference: p.reference,
        notes: undefined,
        status: (p.status as VendorPaymentStatus) || 'Posted',
      }));

    const search = filters?.search?.toLowerCase();
    if (search) result = result.filter((p) => p.paymentNumber.toLowerCase().includes(search) || (p.vendorName?.toLowerCase().includes(search) ?? false) || (p.billNumber?.toLowerCase().includes(search) ?? false) || (p.reference?.toLowerCase().includes(search) ?? false));
    if (filters?.status && filters.status !== 'ALL') result = result.filter((p) => p.status === filters.status);
    if (filters?.vendorId) result = result.filter((p) => p.vendorId === filters.vendorId);
    if (filters?.paymentMethod && filters.paymentMethod !== 'ALL') result = result.filter((p) => p.paymentMethod === filters.paymentMethod);
    if (filters?.fromDate) result = result.filter((p) => p.paymentDate >= filters.fromDate!);
    if (filters?.toDate) result = result.filter((p) => p.paymentDate <= filters.toDate!);
    return result;
  },

  async getVendorPayment(id: string): Promise<VendorPayment | undefined> {
    return (await vendorPaymentService.getVendorPayments()).find((p) => p.id === id);
  },

  async createVendorPayment(input: VendorPaymentInput): Promise<VendorPayment> {
    const journalId = await resolvePaymentJournalId(input.paymentMethod);
    const draft = await api.post<BackendPayment>('/api/payments/', {
      document_id: input.vendorBillId,
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
      vendorId: '',
      vendorName: undefined,
      vendorBillId: input.vendorBillId,
      billNumber: numberFor('BILL', input.vendorBillId),
      amount: num(draft.amount),
      paymentMethod: (draft.method as VendorPaymentMethod) ?? input.paymentMethod,
      reference: draft.reference,
      notes: input.notes || '',
      status: (draft.status as VendorPaymentStatus) || 'Draft',
    };
  },

  async updateVendorPayment(id: string, input: Partial<VendorPaymentInput>): Promise<VendorPayment> {
    const current = await vendorPaymentService.getVendorPayment(id);
    if (!current) throw new ApiError(404, 'Payment not found.');
    const method = input.paymentMethod ?? current.paymentMethod;
    const journalId = await resolvePaymentJournalId(method);
    const updated = await api.put<BackendPayment>(`/api/payments/${id}`, {
      journal_id: journalId,
      payment_date: input.paymentDate ?? current.paymentDate,
      amount: input.amount ?? current.amount,
      reference: (input.reference ?? current.reference) || '',
      method,
    });
    return {
      ...current,
      paymentDate: updated.payment_date,
      amount: num(updated.amount),
      paymentMethod: (updated.method as VendorPaymentMethod) ?? method,
      reference: updated.reference,
      notes: input.notes ?? current.notes,
      status: (updated.status as VendorPaymentStatus) || current.status,
    };
  },

  async postVendorPayment(id: string): Promise<VendorPayment> {
    await api.post<BackendPayment>(`/api/payments/${id}/post`);
    const p = await vendorPaymentService.getVendorPayment(id);
    if (!p) throw new ApiError(404, 'Payment not found after posting.');
    return p;
  },

  async cancelVendorPayment(id: string): Promise<VendorPayment> {
    await api.post<BackendPayment>(`/api/payments/${id}/cancel`);
    const p = await vendorPaymentService.getVendorPayment(id);
    if (!p) throw new ApiError(404, 'Payment not found after cancelling.');
    return p;
  },
};
