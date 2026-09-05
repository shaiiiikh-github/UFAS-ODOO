import React, { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { SummaryCard } from './components/SummaryCard';
import { DateRangeSelector } from './components/DateRangeSelector';
import { QuickActions } from './components/QuickActions';
import { RevenueExpenseChart } from './components/RevenueExpenseChart';
import { PaymentStatus } from './components/PaymentStatus';
import { RecentTransactions } from './components/RecentTransactions';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { DashboardError } from './components/DashboardError';
import { useDashboard } from '@/hooks/useDashboard';
import {
  ShoppingCart,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('This Month');
  const { data, isLoading, error, refetch } = useDashboard(dateRange);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError onRetry={() => refetch()} />;
  }

  if (!data) {
    return null;
  }

  const { summary, revenueExpense, paymentStatus, recentTransactions } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your business performance and financial activity."
        actions={
          <DateRangeSelector
            value={dateRange}
            onChange={setDateRange}
            onRefresh={() => refetch()}
            isLoading={isLoading}
          />
        }
      />

      {/* Quick Actions */}
      <QuickActions />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <SummaryCard
          label="Total Sales"
          amount={summary.totalSales}
          change={summary.salesChange}
          icon={ShoppingCart}
        />
        <SummaryCard
          label="Total Purchases"
          amount={summary.totalPurchases}
          change={summary.purchasesChange}
          icon={Package}
        />
        <SummaryCard
          label="Receivables"
          amount={summary.receivables}
          change={summary.receivablesChange}
          icon={ArrowDownLeft}
        />
        <SummaryCard
          label="Payables"
          amount={summary.payables}
          change={summary.payablesChange}
          icon={ArrowUpRight}
        />
        <SummaryCard
          label="Net Profit"
          amount={summary.netProfit}
          change={summary.profitChange}
          icon={TrendingUp}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueExpenseChart data={revenueExpense} />
        <PaymentStatus data={paymentStatus} />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions transactions={recentTransactions} />
    </div>
  );
};