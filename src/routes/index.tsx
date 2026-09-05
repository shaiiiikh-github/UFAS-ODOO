import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, FileText } from 'lucide-react';
import { Login } from '@/pages/auth/Login';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { Contacts } from '@/pages/master/contacts/Contacts';
import { Products } from '@/pages/master/products/Products'; // 👈 Import Products
import { Accounts } from '@/pages/master/accounts/Accounts';
import { Journals } from '@/pages/master/journals/Journals';
import { AnalyticAccounts } from '@/pages/master/analytics/AnalyticAccounts';

// ---------- Placeholder page ----------
const PlaceholderPage: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <>
    <PageHeader
      title={title}
      description={description}
      actions={
        <>
          <Button variant="outline" size="sm" className="px-4 py-1.5 text-sm">
            <Plus className="h-4 w-4 mr-1.5" /> Add
          </Button>
          <Button variant="outline" size="sm" className="px-4 py-1.5 text-sm">
            <FileText className="h-4 w-4 mr-1.5" /> Export
          </Button>
          <Button size="sm" className="px-4 py-1.5 text-sm bg-[#1a2a3a] hover:bg-[#2a3f56]">
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
        </>
      }
    />
    <div className="bg-white border border-[#e5e7eb] rounded-lg shadow-sm p-10 text-center text-[#6b7280] max-w-2xl mx-auto mt-2">
      <div className="text-[#d1d5db] mb-4">
        <FileText className="h-12 w-12 mx-auto" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-medium text-[#1a2332]">{title}</h3>
      <p className="text-sm mt-1">This page is under construction.</p>
      <div className="mt-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          Coming soon
        </span>
      </div>
    </div>
  </>
);

// Helper to generate route objects for placeholder pages
const page = (title: string, description: string) => ({
  element: (
    <AppShell>
      <PlaceholderPage title={title} description={description} />
    </AppShell>
  ),
});

// ---------- Router ----------
export const router = createBrowserRouter([
  // Login route – no AppShell
  {
    path: '/login',
    element: <Login />,
  },

  // Root redirect to dashboard
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },

  // Dashboard route – uses real Dashboard component
  {
    path: '/dashboard',
    element: (
      <AppShell>
        <Dashboard />
      </AppShell>
    ),
  },

  // Contacts route – uses real Contacts component
  {
    path: '/master/contacts',
    element: (
      <AppShell>
        <Contacts />
      </AppShell>
    ),
  },

  // Products route – uses real Products component
  {
    path: '/master/products',
    element: (
      <AppShell>
        <Products />
      </AppShell>
    ),
  },

  // All other routes use placeholder pages
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
    ...page('Budgets', 'Manage budgets.'),
  },
  {
    path: '/sales/orders',
    ...page('Sales Orders', 'Manage sales orders.'),
  },
  {
    path: '/sales/invoices',
    ...page('Customer Invoices', 'Manage customer invoices.'),
  },
  {
    path: '/sales/payments',
    ...page('Customer Payments', 'Manage customer payments.'),
  },
  {
    path: '/purchases/orders',
    ...page('Purchase Orders', 'Manage purchase orders.'),
  },
  {
    path: '/purchases/bills',
    ...page('Vendor Bills', 'Manage vendor bills.'),
  },
  {
    path: '/purchases/payments',
    ...page('Vendor Payments', 'Manage vendor payments.'),
  },
  {
    path: '/accounting/journal-entries',
    ...page('Journal Entries', 'Manage journal entries.'),
  },
  {
    path: '/accounting/ledgers',
    ...page('Ledgers', 'Manage ledgers.'),
  },
  {
    path: '/reports/profit-loss',
    ...page('Profit & Loss', 'View profit and loss report.'),
  },
  {
    path: '/reports/balance-sheet',
    ...page('Balance Sheet', 'View balance sheet report.'),
  },
  {
    path: '/reports/budget',
    ...page('Budget Report', 'View budget report.'),
  },
  {
    path: '/settings',
    ...page('Settings', 'Configure system settings.'),
  },
  {
    path: '/help',
    ...page('Help', 'Get help and support.'),
  },
]);