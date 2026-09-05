import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AppShell } from '@/components/layout/AppShell';
import { Login } from '@/pages/auth/Login';
import { Dashboard } from '@/pages/dashboard/Dashboard';

import { Contacts } from '@/pages/master/contacts/Contacts';
import { Products } from '@/pages/master/products/Products';
import { Accounts } from '@/pages/master/accounts/Accounts';
import { Journals } from '@/pages/master/journals/Journals';
import { AnalyticAccounts } from '@/pages/master/analytics/AnalyticAccounts';
import { Budgets } from '@/pages/master/budgets/Budgets';

import { SalesOrders } from '@/pages/sales/orders/SalesOrders';
import { CustomerInvoices } from '@/pages/sales/invoices/CustomerInvoices';
import { CustomerPayments } from '@/pages/sales/payments/CustomerPayments';

import { PurchaseOrders } from '@/pages/purchases/orders/PurchaseOrders';
import { VendorBills } from '@/pages/purchases/bills/VendorBills';
import { VendorPayments } from '@/pages/purchases/payments/VendorPayments';

import { JournalEntries } from '@/pages/accounting/journal-entries/JournalEntries';
import { Ledgers } from '@/pages/accounting/ledgers/Ledgers';

import { ProfitLoss } from '@/pages/reports/profit-loss/ProfitLoss';
import { BalanceSheet } from '@/pages/reports/balance-sheet/BalanceSheet';
import { BudgetReport } from '@/pages/reports/budget/BudgetReport';

import { PartnerPortal } from '@/pages/portal/PartnerPortal';
import { RequireAuth } from '@/components/auth/RequireAuth';

import { PlaceholderPage } from '@/pages/common/PlaceholderPage';

const page = (
  title: string,
  description: string
) => ({
  element: (
    <AppShell>
      <PlaceholderPage
        title={title}
        description={description}
      />
    </AppShell>
  ),
});

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },

  {
    path: '/',
    element: (
      <Navigate
        to="/dashboard"
        replace
      />
    ),
  },

  {
    path: '/dashboard',
    element: (
      <AppShell>
        <Dashboard />
      </AppShell>
    ),
  },

  {
    path: '/master/contacts',
    element: (
      <AppShell>
        <Contacts />
      </AppShell>
    ),
  },

  {
    path: '/master/products',
    element: (
      <AppShell>
        <Products />
      </AppShell>
    ),
  },

  {
    path: '/master/accounts',
    element: (
      <AppShell>
        <Accounts />
      </AppShell>
    ),
  },

  {
    path: '/master/journals',
    element: (
      <AppShell>
        <Journals />
      </AppShell>
    ),
  },

  {
    path: '/master/analytics',
    element: (
      <AppShell>
        <AnalyticAccounts />
      </AppShell>
    ),
  },

  {
    path: '/master/budgets',
    element: (
      <AppShell>
        <Budgets />
      </AppShell>
    ),
  },

  {
    path: '/sales/orders',
    element: (
      <AppShell>
        <SalesOrders />
      </AppShell>
    ),
  },

  {
    path: '/sales/invoices',
    element: (
      <AppShell>
        <CustomerInvoices />
      </AppShell>
    ),
  },

  {
    path: '/sales/payments',
    element: (
      <AppShell>
        <CustomerPayments />
      </AppShell>
    ),
  },

  {
    path: '/purchases/orders',
    element: (
      <AppShell>
        <PurchaseOrders />
      </AppShell>
    ),
  },

  {
    path: '/purchases/bills',
    element: (
      <AppShell>
        <VendorBills />
      </AppShell>
    ),
  },

  {
    path: '/purchases/payments',
    element: (
      <AppShell>
        <VendorPayments />
      </AppShell>
    ),
  },

  {
    path: '/accounting/journal-entries',
    element: (
      <AppShell>
        <JournalEntries />
      </AppShell>
    ),
  },

  {
    path: '/accounting/ledgers',
    element: (
      <AppShell>
        <Ledgers />
      </AppShell>
    ),
  },

  {
    path: '/reports/profit-loss',
    element: (
      <AppShell>
        <ProfitLoss />
      </AppShell>
    ),
  },

  {
    path: '/reports/balance-sheet',
    element: (
      <AppShell>
        <BalanceSheet />
      </AppShell>
    ),
  },

  {
    path: '/reports/budget',
    element: (
      <AppShell>
        <BudgetReport />
      </AppShell>
    ),
  },

  {
    path: '/portal',
    element: (
      <RequireAuth roles={['CUSTOMER', 'VENDOR']}>
        <PartnerPortal />
      </RequireAuth>
    ),
  },

  {
    path: '/portal/invoices',
    element: (
      <RequireAuth roles={['CUSTOMER', 'VENDOR']}>
        <PartnerPortal />
      </RequireAuth>
    ),
  },

  {
    path: '/portal/orders',
    element: (
      <RequireAuth roles={['CUSTOMER', 'VENDOR']}>
        <PartnerPortal />
      </RequireAuth>
    ),
  },

  {
    path: '/portal/payments',
    element: (
      <RequireAuth roles={['CUSTOMER', 'VENDOR']}>
        <PartnerPortal />
      </RequireAuth>
    ),
  },

  {
    path: '/settings',
    ...page(
      'Settings',
      'Configure system settings.'
    ),
  },

  {
    path: '/help',
    ...page(
      'Help',
      'Get help and support.'
    ),
  },
]);