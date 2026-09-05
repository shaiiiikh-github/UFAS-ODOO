import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LABEL_MAP: Record<string, string> = {
  dashboard: 'navigation:dashboard',
  master: 'navigation:masterData', contacts: 'navigation:contacts', products: 'navigation:products', accounts: 'navigation:accounts', journals: 'navigation:journals', analytics: 'navigation:analytics', budgets: 'navigation:budgets', sales: 'navigation:sales', orders: 'navigation:salesOrders', invoices: 'navigation:customerInvoices', payments: 'navigation:customerPayments', purchases: 'navigation:purchases', bills: 'navigation:vendorBills', accounting: 'navigation:accounting', 'journal-entries': 'navigation:journalEntries', ledgers: 'navigation:ledgers', reports: 'navigation:reports', 'profit-loss': 'navigation:profitLoss', 'balance-sheet': 'navigation:balanceSheet', budget: 'navigation:budgetReport', settings: 'common:settings', help: 'navigation:help',
};

export const Breadcrumbs: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean);

  if (pathnames.length === 0) {
    return <span className="text-sm font-medium text-[#1a2332]">{t('navigation:dashboard')}</span>;
  }

  return (
    <nav className="flex items-center text-sm text-[#6b7280] gap-1 flex-wrap">
      {pathnames.map((segment, index) => {
        const to = '/' + pathnames.slice(0, index + 1).join('/');
        const isLast = index === pathnames.length - 1;
        const label = LABEL_MAP[segment] ? t(LABEL_MAP[segment]) : segment;

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
