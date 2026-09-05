import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { RevenueExpensePoint } from '@/types/dashboard';
import { formatCurrency } from '@/lib/format';

interface RevenueExpenseChartProps {
  data: RevenueExpensePoint[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#e5e7eb] rounded-md shadow-sm p-3 text-sm">
        <p className="font-medium text-[#1a2332]">{label}</p>
        <p className="text-[#1a2332]">
          Revenue: <span className="font-semibold">{formatCurrency(payload[0].value)}</span>
        </p>
        <p className="text-[#1a2332]">
          Expenses: <span className="font-semibold">{formatCurrency(payload[1].value)}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const RevenueExpenseChart: React.FC<RevenueExpenseChartProps> = ({ data }) => {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-md p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-[#1a2332]">Revenue & Expenses</h3>
        <p className="text-xs text-[#6b7280]">Monthly financial activity</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <YAxis
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#1a2a3a"
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#6b7280"
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
