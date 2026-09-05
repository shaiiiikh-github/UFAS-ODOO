import type { PortalDashboard, PortalInvoice, PortalOrder, PortalPayment, PortalRole } from '@/types/portal';

type PartnerData = { invoices: PortalInvoice[]; orders: PortalOrder[]; payments: PortalPayment[] };
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const partners: Record<PortalRole, Record<string, PartnerData>> = {
  CUSTOMER: {
    'customer-rahul': { invoices: [{ id: 'ci-1', number: 'INV-1001', date: '2025-02-05', dueDate: '2025-03-05', total: 118000, paid: 50000, balance: 68000, status: 'Partially Paid' }, { id: 'ci-2', number: 'INV-1002', date: '2025-02-12', dueDate: '2025-03-12', total: 35400, paid: 0, balance: 35400, status: 'Posted' }], orders: [{ id: 'so-1', number: 'SO-1001', date: '2025-01-15', total: 115640, status: 'Confirmed' }], payments: [{ id: 'cp-1', number: 'CP-1001', date: '2025-02-18', amount: 50000, method: 'Bank', reference: 'UTR-10922' }] },
  },
  VENDOR: {
    'vendor-priya': { invoices: [{ id: 'vb-1', number: 'VB-1001', date: '2025-02-05', dueDate: '2025-03-05', total: 63720, paid: 0, balance: 63720, status: 'Posted' }], orders: [{ id: 'po-1', number: 'PO-1001', date: '2025-02-03', total: 63720, status: 'Confirmed' }], payments: [] },
  },
};
const dataFor = (role: PortalRole, partnerId: string): PartnerData => partners[role][partnerId] ?? { invoices: [], orders: [], payments: [] };
export const portalService = {
  async getDashboard(role: PortalRole, partnerId: string): Promise<PortalDashboard> { await delay(200); const data = dataFor(role, partnerId); const open = data.invoices.filter(invoice => invoice.balance > 0); return { role, openCount: open.length, outstandingAmount: open.reduce((sum, invoice) => sum + invoice.balance, 0), recentOrders: data.orders, recentPayments: data.payments }; },
  async getInvoices(role: PortalRole, partnerId: string) { await delay(200); return dataFor(role, partnerId).invoices; },
  async getOrders(role: PortalRole, partnerId: string) { await delay(200); return dataFor(role, partnerId).orders; },
  async getPayments(role: PortalRole, partnerId: string) { await delay(200); return dataFor(role, partnerId).payments; },
};
