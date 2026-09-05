import type { DashboardData } from '@/types/dashboard';
import type { DashboardSummary, RevenueExpensePoint, PaymentStatusSummary, RecentTransaction } from '@/types/dashboard';

// Mock data – isolated for development, easily replaceable with API calls
const mockSummary: DashboardSummary = {
  totalSales: 842500,
  totalPurchases: 523000,
  receivables: 215000,
  payables: 98000,
  netProfit: 319500,
  salesChange: 12.4,
  purchasesChange: -4.8,
  receivablesChange: 7.2,
  payablesChange: -2.1,
  profitChange: 15.6,
};

const mockRevenueExpense: RevenueExpensePoint[] = [
  { month: 'Jan', revenue: 620000, expenses: 410000 },
  { month: 'Feb', revenue: 710000, expenses: 450000 },
  { month: 'Mar', revenue: 680000, expenses: 430000 },
  { month: 'Apr', revenue: 790000, expenses: 490000 },
  { month: 'May', revenue: 842500, expenses: 523000 },
  { month: 'Jun', revenue: 850000, expenses: 530000 },
];

const mockPaymentStatus: PaymentStatusSummary = {
  paid: 420000,
  partiallyPaid: 125000,
  pending: 105000,
  overdue: 42000,
  paidCount: 45,
  partiallyPaidCount: 12,
  pendingCount: 8,
  overdueCount: 3,
};

const mockTransactions: RecentTransaction[] = [
  {
    id: '1',
    date: '2026-06-05',
    reference: 'SO-1024',
    contact: 'Modular Interiors',
    type: 'Sales Order',
    amount: 125000,
    status: 'confirmed',   // was 'Confirmed'
  },
  {
    id: '2',
    date: '2026-06-04',
    reference: 'CI-089',
    contact: 'Heritage Furniture',
    type: 'Customer Invoice',
    amount: 78000,
    status: 'paid',        // was 'Paid'
  },
  {
    id: '3',
    date: '2026-06-03',
    reference: 'PO-056',
    contact: 'Timber World',
    type: 'Purchase Order',
    amount: 45000,
    status: 'pending',     // was 'Pending'
  },
  {
    id: '4',
    date: '2026-06-02',
    reference: 'VB-022',
    contact: 'Hardware Supplies Co',
    type: 'Vendor Bill',
    amount: 32000,
    status: 'overdue',     // was 'Overdue'
  },
  {
    id: '5',
    date: '2026-06-01',
    reference: 'CP-067',
    contact: 'Elegant Designs',
    type: 'Customer Payment',
    amount: 52000,
    status: 'paid',
  },
  {
    id: '6',
    date: '2026-05-31',
    reference: 'SO-1019',
    contact: 'Artisan Furniture',
    type: 'Sales Order',
    amount: 95000,
    status: 'draft',       // was 'Draft'
  },
];

// The service – will be replaced with real API calls
export const dashboardService = {
  getDashboardData: async (dateRange: string): Promise<DashboardData> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // In the future, this will be: return fetch(`/api/dashboard?range=${dateRange}`).then(res => res.json())
    // For now, return mock data
    return {
      summary: mockSummary,
      revenueExpense: mockRevenueExpense,
      paymentStatus: mockPaymentStatus,
      recentTransactions: mockTransactions,
    };
  },
};