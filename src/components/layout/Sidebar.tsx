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

const NAV_GROUPS = [
  {
    group: 'Dashboard',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    ],
  },
  {
    group: 'Master Data',
    items: [
      { id: 'contacts', label: 'Contacts', icon: Users, path: '/master/contacts' },
      { id: 'products', label: 'Products', icon: Package, path: '/master/products' },
      { id: 'accounts', label: 'Chart of Accounts', icon: BookOpen, path: '/master/accounts' },
      { id: 'journals', label: 'Journals', icon: Notebook, path: '/master/journals' },
      { id: 'analytics', label: 'Analytic Accounts', icon: PieChart, path: '/master/analytics' },
      { id: 'budgets', label: 'Budgets', icon: Coins, path: '/master/budgets' },
    ],
  },
  {
    group: 'Sales',
    items: [
      { id: 'sales-orders', label: 'Sales Orders', icon: ShoppingCart, path: '/sales/orders' },
      { id: 'sales-invoices', label: 'Customer Invoices', icon: FileText, path: '/sales/invoices' },
      { id: 'sales-payments', label: 'Customer Payments', icon: CreditCard, path: '/sales/payments' },
    ],
  },
  {
    group: 'Purchases',
    items: [
      { id: 'purch-orders', label: 'Purchase Orders', icon: Truck, path: '/purchases/orders' },
      { id: 'purch-bills', label: 'Vendor Bills', icon: FileText, path: '/purchases/bills' },
      { id: 'purch-payments', label: 'Vendor Payments', icon: CreditCard, path: '/purchases/payments' },
    ],
  },
  {
    group: 'Accounting',
    items: [
      { id: 'journal-entries', label: 'Journal Entries', icon: BookOpen, path: '/accounting/journal-entries' },
      { id: 'ledgers', label: 'Ledgers', icon: Layers, path: '/accounting/ledgers' },
    ],
  },
  {
    group: 'Reports',
    items: [
      { id: 'report-pl', label: 'Profit & Loss', icon: BarChart2, path: '/reports/profit-loss' },
      { id: 'report-bs', label: 'Balance Sheet', icon: FileSpreadsheet, path: '/reports/balance-sheet' },
      { id: 'report-budget', label: 'Budget Report', icon: PieChart, path: '/reports/budget' },
    ],
  },
];

const BOTTOM_NAV = [
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  { id: 'help', label: 'Help', icon: HelpCircle, path: '/help' },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const toggleCollapse = () => setCollapsed((prev) => !prev);

  const NavLinkItem = ({ item }: { item: typeof NAV_GROUPS[0]['items'][0] }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-md text-[0.85rem] font-medium transition-all duration-150',
            isActive
              ? 'bg-[#eef2f6] text-[#1a2a3a] border-l-2 border-[#1a2a3a] pl-2.5'
              : 'text-[#6b7280] hover:bg-[#f3f5f7] hover:text-[#1a2a3a]'
          )
        }
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
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
                  {group.group}
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