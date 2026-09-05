import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const LABEL_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  master: 'Master Data',
  contacts: 'Contacts',
  products: 'Products',
  accounts: 'Chart of Accounts',
  journals: 'Journals',
  analytics: 'Analytic Accounts',
  budgets: 'Budgets',
  sales: 'Sales',
  orders: 'Orders',
  invoices: 'Invoices',
  payments: 'Payments',
  purchases: 'Purchases',
  bills: 'Bills',
  accounting: 'Accounting',
  'journal-entries': 'Journal Entries',
  ledgers: 'Ledgers',
  reports: 'Reports',
  'profit-loss': 'Profit & Loss',
  'balance-sheet': 'Balance Sheet',
  budget: 'Budget Report',
  settings: 'Settings',
  help: 'Help',
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean);

  if (pathnames.length === 0) {
    return <span className="text-sm font-medium text-[#1a2332]">Dashboard</span>;
  }

  return (
    <nav className="flex items-center text-sm text-[#6b7280] gap-1 flex-wrap">
      {pathnames.map((segment, index) => {
        const to = '/' + pathnames.slice(0, index + 1).join('/');
        const isLast = index === pathnames.length - 1;
        const label = LABEL_MAP[segment] || segment;

        return (
          <React.Fragment key={to}>
            {index > 0 && <span className="text-[#9ca3af] mx-1">/</span>}
            {isLast ? (
              <span className="font-medium text-[#1a2332]">{label}</span>
            ) : (
              <Link to={to} className="hover:text-[#1a2332] hover:bg-[#eef2f6] px-1 py-0.5 rounded transition-colors">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};