export interface DashboardSummary {
  totalSales: number;
  totalPurchases: number;
  receivables: number;
  payables: number;
  netProfit: number;
  salesChange: number;      // percentage change
  purchasesChange: number;
  receivablesChange: number;
  payablesChange: number;
  profitChange: number;
}

export interface RevenueExpensePoint {
  month: string;
  revenue: number;
  expenses: number;
}

export interface PaymentStatusSummary {
  paid: number;           // total amount
  partiallyPaid: number;
  pending: number;
  overdue: number;
  paidCount?: number;
  partiallyPaidCount?: number;
  pendingCount?: number;
  overdueCount?: number;
}

export interface RecentTransaction {
  id: string;
  date: string;
  reference: string;
  contact: string;
  type: 'Sales Order' | 'Customer Invoice' | 'Customer Payment' | 'Purchase Order' | 'Vendor Bill' | 'Vendor Payment';
  amount: number;
  status: 'draft' | 'confirmed' | 'pending' | 'paid' | 'partially paid' | 'overdue';
}

export interface DashboardData {
  summary: DashboardSummary;
  revenueExpense: RevenueExpensePoint[];
  paymentStatus: PaymentStatusSummary;
  recentTransactions: RecentTransaction[];
}