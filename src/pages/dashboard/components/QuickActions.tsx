import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ShoppingCart, Package, FileText, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

const actions = [
  { label: 'Sales Order', icon: ShoppingCart, path: '/sales/orders' },
  { label: 'Purchase Order', icon: Package, path: '/purchases/orders' },
  { label: 'Customer Invoice', icon: FileText, path: '/sales/invoices' },
  { label: 'Vendor Bill', icon: CreditCard, path: '/purchases/bills' },
];

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action.path}
          variant="outline"
          size="sm"
          onClick={() => navigate(action.path)}
          className="text-sm gap-1.5"
        >
          <action.icon className="h-3.5 w-3.5" />
          {action.label}
        </Button>
      ))}
    </div>
  );
};