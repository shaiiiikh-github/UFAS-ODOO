import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { PaymentStatusSummary } from '@/types/dashboard';
import { formatCurrency } from '@/lib/format';

interface PaymentStatusProps {
  data: PaymentStatusSummary;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  paid: { label: 'Paid', color: '#059669' },
  partiallyPaid: { label: 'Partially Paid', color: '#d97706' },
  pending: { label: 'Pending', color: '#3b82f6' },
  overdue: { label: 'Overdue', color: '#dc2626' },
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
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
  const chartData = Object.entries(STATUS_CONFIG)
    .map(([key, config]) => ({
      name: config.label,
      value: data[key as keyof PaymentStatusSummary] as number,
      dataKey: key,
    }))
    .filter((item) => item.value > 0);

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-md p-4 shadow-sm overflow-hidden">
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
                    key={entry.dataKey}
                    fill={STATUS_CONFIG[entry.dataKey].color}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 min-w-0 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
              const value = data[key as keyof PaymentStatusSummary] as number;
              const countKey = key + 'Count' as keyof PaymentStatusSummary;
              const count = data[countKey as keyof PaymentStatusSummary] as number | undefined;
              return (
                <div key={key} className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-[#6b7280] whitespace-nowrap">{config.label}</span>
                  <span className="ml-auto font-medium text-[#1a2332] truncate">
                    {formatCurrency(value)}
                  </span>
                  {count !== undefined && (
                    <span className="text-xs text-[#6b7280] flex-shrink-0">({count})</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};