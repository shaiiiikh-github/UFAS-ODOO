import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { PaymentStatusSummary } from '@/types/dashboard';
import { formatCurrency } from '@/lib/format';

interface PaymentStatusProps {
  data: PaymentStatusSummary;
}

const STATUS_COLORS = {
  paid: '#059669',        // green
  partiallyPaid: '#d97706', // amber
  pending: '#3b82f6',     // blue
  overdue: '#dc2626',     // red
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    return (
      <div className="bg-white border border-[#e5e7eb] rounded-md shadow-sm p-2 text-sm">
        <p className="font-medium text-[#1a2332]">{name}</p>
        <p>{formatCurrency(value)}</p>
      </div>
    );
  }
  return null;
};

export const PaymentStatus: React.FC<PaymentStatusProps> = ({ data }) => {
  const chartData = [
    { name: 'Paid', value: data.paid },
    { name: 'Partially Paid', value: data.partiallyPaid },
    { name: 'Pending', value: data.pending },
    { name: 'Overdue', value: data.overdue },
  ].filter((item) => item.value > 0);

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-md p-4 shadow-sm">
      <h3 className="text-sm font-medium text-[#1a2332] mb-3">Payment Status</h3>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name.toLowerCase() as keyof typeof STATUS_COLORS] || '#9ca3af'}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {Object.entries(data).map(([key, value]) => {
            if (key === 'paidCount' || key === 'partiallyPaidCount' || key === 'pendingCount' || key === 'overdueCount') {
              return null;
            }
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            const color = STATUS_COLORS[key as keyof typeof STATUS_COLORS] || '#6b7280';
            const countKey = key + 'Count' as keyof PaymentStatusSummary;
            const count = data[countKey as keyof PaymentStatusSummary] as number | undefined;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[#6b7280]">{label}</span>
                <span className="ml-auto font-medium text-[#1a2332]">{formatCurrency(value as number)}</span>
                {count !== undefined && (
                  <span className="text-xs text-[#6b7280]">({count})</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};