import React from 'react';
import type { RecentTransaction } from '@/types/dashboard';
import { formatCurrency } from '@/lib/format';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ExternalLink } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: RecentTransaction[];
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white border border-[#e5e7eb] rounded-md p-6 text-center text-[#6b7280]">
        <p className="text-sm">No recent transactions</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-md shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-[#e5e7eb]">
        <h3 className="text-sm font-medium text-[#1a2332]">Recent Transactions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#e5e7eb]">
          <thead className="bg-[#f9fafb]">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Reference</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Contact</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Type</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-[#6b7280] uppercase tracking-wider">Amount</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Status</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-[#6b7280] uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-[#f9fafb] transition-colors">
                <td className="px-4 py-2.5 text-sm text-[#1a2332]">{new Date(tx.date).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-2.5 text-sm text-[#1a2332] font-medium">{tx.reference}</td>
                <td className="px-4 py-2.5 text-sm text-[#1a2332]">{tx.contact}</td>
                <td className="px-4 py-2.5 text-sm text-[#6b7280]">{tx.type}</td>
                <td className="px-4 py-2.5 text-sm text-right font-medium text-[#1a2332]">
                  {formatCurrency(tx.amount)}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={tx.status} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    className="text-[#6b7280] hover:text-[#1a2a3a] transition-colors"
                    aria-label="View transaction"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};