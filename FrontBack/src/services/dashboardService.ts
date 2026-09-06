import type { DashboardData, RevenueExpensePoint, RecentTransaction } from '@/types/dashboard';
import { api, num } from '@/lib/api';
import { fetchDocuments, numberFor, type BackendDoc } from '@/lib/documents';

interface BackendPayment {
  id: string;
  document_id: string;
  payment_date: string;
  amount: number | string;
  reference: string;
}
interface PnL {
  total_income: number | string;
  total_expense: number | string;
  net_profit: number | string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthLabel = (isoDate: string) => MONTHS[Number(isoDate.slice(5, 7)) - 1] ?? isoDate.slice(0, 7);

export const dashboardService = {
  getDashboardData: async (dateRange: string): Promise<DashboardData> => {
    void dateRange; // backend has no configurable range; using all posted activity
    const [docs, payments, pnl] = await Promise.all([
      fetchDocuments(),
      api.get<BackendPayment[]>('/api/payments/').catch(() => [] as BackendPayment[]),
      api.get<PnL>('/api/reports/pnl').catch(() => ({ total_income: 0, total_expense: 0, net_profit: 0 } as PnL)),
    ]);

    const invoices = docs.filter((d) => d.type === 'Customer Invoice');
    const bills = docs.filter((d) => d.type === 'Vendor Bill');
    const posted = (d: BackendDoc) => d.status !== 'Draft';

    const totalSales = invoices.filter(posted).reduce((s, d) => s + num(d.total), 0);
    const totalPurchases = bills.filter(posted).reduce((s, d) => s + num(d.total), 0);
    const receivables = invoices.reduce((s, d) => s + num(d.outstanding_amount), 0);
    const payables = bills.reduce((s, d) => s + num(d.outstanding_amount), 0);

    // Revenue/expense grouped by month (order preserved by first appearance).
    const byMonth = new Map<string, RevenueExpensePoint>();
    const bump = (isoDate: string, key: 'revenue' | 'expenses', value: number) => {
      const label = monthLabel(isoDate);
      const point = byMonth.get(label) ?? { month: label, revenue: 0, expenses: 0 };
      point[key] += value;
      byMonth.set(label, point);
    };
    invoices.filter(posted).forEach((d) => bump(d.date, 'revenue', num(d.total)));
    bills.filter(posted).forEach((d) => bump(d.date, 'expenses', num(d.total)));

    const paymentStatusFor = (list: BackendDoc[]) => list;
    const allBillsInvoices = paymentStatusFor([...invoices, ...bills]);
    const sumWhere = (pred: (d: BackendDoc) => boolean, field: (d: BackendDoc) => number) =>
      allBillsInvoices.filter(pred).reduce((s, d) => s + field(d), 0);
    const countWhere = (pred: (d: BackendDoc) => boolean) => allBillsInvoices.filter(pred).length;

    const recentDocs: RecentTransaction[] = docs.slice(0, 8).map((d) => ({
      id: d.id,
      date: d.date,
      reference: numberFor(d.type === 'Customer Invoice' ? 'INV' : d.type === 'Vendor Bill' ? 'BILL' : d.type === 'Sales Order' ? 'SO' : 'PO', d.id),
      contact: d.contact_name ?? '',
      type: d.type,
      amount: num(d.total),
      status: (d.status === 'Draft' ? 'draft' : d.status === 'Confirmed' ? 'confirmed' : d.status === 'Paid' ? 'paid' : d.status === 'Partially Paid' ? 'partially paid' : 'pending') as RecentTransaction['status'],
    }));
    const recentPays: RecentTransaction[] = payments.slice(0, 4).map((p) => ({
      id: p.id,
      date: p.payment_date,
      reference: numberFor('PAY', p.id),
      contact: '',
      type: 'Customer Payment',
      amount: num(p.amount),
      status: 'paid',
    }));
    const recentTransactions = [...recentDocs, ...recentPays]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);

    return {
      summary: {
        totalSales,
        totalPurchases,
        receivables,
        payables,
        netProfit: num(pnl.net_profit),
        // No historical baseline is available from the backend, so deltas are 0.
        salesChange: 0,
        purchasesChange: 0,
        receivablesChange: 0,
        payablesChange: 0,
        profitChange: 0,
      },
      revenueExpense: Array.from(byMonth.values()),
      paymentStatus: {
        paid: sumWhere((d) => d.status === 'Paid', (d) => num(d.total)),
        partiallyPaid: sumWhere((d) => d.status === 'Partially Paid', (d) => num(d.outstanding_amount)),
        pending: sumWhere((d) => d.status === 'Confirmed', (d) => num(d.outstanding_amount)),
        overdue: 0, // backend has no due dates
        paidCount: countWhere((d) => d.status === 'Paid'),
        partiallyPaidCount: countWhere((d) => d.status === 'Partially Paid'),
        pendingCount: countWhere((d) => d.status === 'Confirmed'),
        overdueCount: 0,
      },
      recentTransactions,
    };
  },
};
