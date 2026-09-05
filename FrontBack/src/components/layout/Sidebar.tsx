import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  BookOpen,
  Notebook,
  PieChart,
  Coins,
  ShoppingCart,
  FileText,
  CreditCard,
  Truck,
  Layers,
  BarChart2,
  FileSpreadsheet,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const NAV_GROUPS = [
  {
    group: 'navigation:dashboard',
    items: [
      { id: 'dashboard', label: 'navigation:dashboard', icon: LayoutDashboard, path: '/dashboard' },
    ],
  },
  {
    group: 'navigation:masterData',
    items: [
      { id: 'contacts', label: 'navigation:contacts', icon: Users, path: '/master/contacts' },
      { id: 'products', label: 'navigation:products', icon: Package, path: '/master/products' },
      { id: 'accounts', label: 'navigation:accounts', icon: BookOpen, path: '/master/accounts' },
      { id: 'journals', label: 'navigation:journals', icon: Notebook, path: '/master/journals' },
      { id: 'analytics', label: 'navigation:analytics', icon: PieChart, path: '/master/analytics' },
      { id: 'budgets', label: 'navigation:budgets', icon: Coins, path: '/master/budgets' },
    ],
  },
  {
    group: 'navigation:sales',
    items: [
      { id: 'sales-orders', label: 'navigation:salesOrders', icon: ShoppingCart, path: '/sales/orders' },
      { id: 'sales-invoices', label: 'navigation:customerInvoices', icon: FileText, path: '/sales/invoices' },
      { id: 'sales-payments', label: 'navigation:customerPayments', icon: CreditCard, path: '/sales/payments' },
    ],
  },
  {
    group: 'navigation:purchases',
    items: [
      { id: 'purch-orders', label: 'navigation:purchaseOrders', icon: Truck, path: '/purchases/orders' },
      { id: 'purch-bills', label: 'navigation:vendorBills', icon: FileText, path: '/purchases/bills' },
      { id: 'purch-payments', label: 'navigation:vendorPayments', icon: CreditCard, path: '/purchases/payments' },
    ],
  },
  {
    group: 'navigation:accounting',
    items: [
      { id: 'journal-entries', label: 'navigation:journalEntries', icon: BookOpen, path: '/accounting/journal-entries' },
      { id: 'ledgers', label: 'navigation:ledgers', icon: Layers, path: '/accounting/ledgers' },
    ],
  },
  {
    group: 'navigation:reports',
    items: [
      { id: 'report-pl', label: 'navigation:profitLoss', icon: BarChart2, path: '/reports/profit-loss' },
      { id: 'report-bs', label: 'navigation:balanceSheet', icon: FileSpreadsheet, path: '/reports/balance-sheet' },
      { id: 'report-budget', label: 'navigation:budgetReport', icon: PieChart, path: '/reports/budget' },
    ],
  },
];

const BOTTOM_NAV = [
  { id: 'settings', label: 'common:settings', icon: Settings, path: '/settings' },
  { id: 'help', label: 'navigation:help', icon: HelpCircle, path: '/help' },
];

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const toggleCollapse = () => setCollapsed((prev) => !prev);

  const NavLinkItem = ({ item }: { item: typeof NAV_GROUPS[0]['items'][0] }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <NavLink
        to={item.path}
        className={() =>
          cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-md text-[0.85rem] font-medium transition-all duration-150',
            isActive
              ? 'bg-[#eef2f6] text-[#1a2a3a] border-l-2 border-[#1a2a3a] pl-2.5'
              : 'text-[#6b7280] hover:bg-[#f3f5f7] hover:text-[#1a2a3a]'
          )
        }
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span>{t(item.label)}</span>}
      </NavLink>
    );
  };

  return (
    <aside
      className={cn(
        'sticky top-0 h-screen bg-white border-r border-[#e5e7eb] flex flex-col transition-width duration-200 overflow-y-auto',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex flex-col h-full px-3 py-4">
        {/* Brand */}
        <div
          className="flex items-center gap-3 pb-4 mb-2 border-b border-[#e5e7eb] cursor-pointer"
          onDoubleClick={toggleCollapse}
        >
          <div className="w-9 h-9 bg-[#1a2a3a] rounded-md flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            UF
          </div>
          {!collapsed && (
            <div>
              <div className="font-bold text-[#1a2a3a] text-base leading-tight">Urban Furniture</div>
              <div className="text-[0.55rem] uppercase tracking-wider text-[#6b7280]">Accounting System</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide">
          {NAV_GROUPS.map((group) => (
            <div key={group.group} className="mb-1">
              {!collapsed && (
                <div className="text-[0.6rem] font-semibold uppercase tracking-widest text-[#9ca3af] px-3 py-1.5">
                  {t(group.group)}
                </div>
              )}
              {group.items.map((item) => (
                <NavLinkItem key={item.id} item={item} />
              ))}
            </div>
          ))}

          {/* Bottom items */}
          <div className="mt-auto pt-3 border-t border-[#e5e7eb]">
            {BOTTOM_NAV.map((item) => (
              <NavLinkItem key={item.id} item={item} />
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
};
