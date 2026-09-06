import type { PortalDashboard, PortalInvoice, PortalOrder, PortalPayment, PortalRole } from '@/types/portal';
import { api, num } from '@/lib/api';
import { fetchDocuments, numberFor, type BackendDoc } from '@/lib/documents';
import { journalService } from '@/services/journalService';

interface BackendPayment {
  id: string;
  document_id: string;
  journal_id: string;
  payment_date: string;
  amount: number | string;
  reference: string;
}

function toPortalInvoice(d: BackendDoc): PortalInvoice {
  return {
    id: d.id,
    number: numberFor(d.type === 'Customer Invoice' ? 'INV' : 'BILL', d.id),
    date: d.date,
    dueDate: undefined,
    total: num(d.total),
    paid: num(d.amount_paid),
    balance: num(d.outstanding_amount),
    status: d.status === 'Confirmed' ? 'Posted' : d.status,
  };
}
function toPortalOrder(d: BackendDoc): PortalOrder {
  return {
    id: d.id,
    number: numberFor(d.type === 'Sales Order' ? 'SO' : 'PO', d.id),
    date: d.date,
    total: num(d.total),
    status: d.status,
  };
}

// The backend scopes /api/documents/ and /api/payments/ to the logged-in contact,
// so role/partnerId are not needed to fetch the right rows.
async function portalDocs(): Promise<BackendDoc[]> {
  return fetchDocuments();
}

export const portalService = {
  async getInvoices(_role: PortalRole, _partnerId: string): Promise<PortalInvoice[]> {
    return (await portalDocs()).filter((d) => d.type === 'Customer Invoice' || d.type === 'Vendor Bill').map(toPortalInvoice);
  },
  async getOrders(_role: PortalRole, _partnerId: string): Promise<PortalOrder[]> {
    return (await portalDocs()).filter((d) => d.type === 'Sales Order' || d.type === 'Purchase Order').map(toPortalOrder);
  },
  async getPayments(_role: PortalRole, _partnerId: string): Promise<PortalPayment[]> {
    try {
      const [payments, journals] = await Promise.all([
        api.get<BackendPayment[]>('/api/payments/'),
        journalService.getJournals().catch(() => []),
      ]);
      const method = new Map(journals.map((j) => [j.id, j.type === 'cash' ? 'Cash' : 'Bank']));
      return payments.map((p) => ({
        id: p.id,
        number: numberFor('PAY', p.id),
        date: p.payment_date,
        amount: num(p.amount),
        method: method.get(p.journal_id) ?? 'Bank',
        reference: p.reference,
      }));
    } catch {
      return [];
    }
  },
  async getDashboard(role: PortalRole, partnerId: string): Promise<PortalDashboard> {
    const [invoices, orders, payments] = await Promise.all([
      portalService.getInvoices(role, partnerId),
      portalService.getOrders(role, partnerId),
      portalService.getPayments(role, partnerId),
    ]);
    const open = invoices.filter((i) => i.balance > 0);
    return {
      role,
      openCount: open.length,
      outstandingAmount: open.reduce((s, i) => s + i.balance, 0),
      recentOrders: orders.slice(0, 5),
      recentPayments: payments.slice(0, 5),
    };
  },
};
