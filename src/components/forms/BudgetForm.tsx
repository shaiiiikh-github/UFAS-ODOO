import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import type { Budget, BudgetInput } from '@/types/budget';
import { useAnalyticAccounts } from '@/hooks/useAnalyticAccounts';

const budgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  period: z.string().min(1, 'Period is required'),
  responsible: z.string().min(1, 'Responsible is required'),
  plannedAmount: z.number().min(0, 'Amount must be greater than or equal to 0'),
  analyticAccountId: z.string().min(1, 'Analytic account is required'),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  initialData?: Budget | null;
  onSubmit: (data: BudgetInput) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const { data: analyticAccounts = [], isLoading: loadingAccounts } = useAnalyticAccounts({ type: 'ALL' });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: initialData?.name || '',
      period: initialData?.period || '',
      responsible: initialData?.responsible || '',
      plannedAmount: initialData?.plannedAmount ?? 0,
      analyticAccountId: initialData?.analyticAccountId || '',
    },
  });

  const handleFormSubmit = (data: BudgetFormData) => {
    onSubmit({
      name: data.name,
      period: data.period,
      responsible: data.responsible,
      plannedAmount: data.plannedAmount,
      analyticAccountId: data.analyticAccountId,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium text-[#1a2332]">
          Budget Name *
        </label>
        <input
          id="name"
          placeholder="Enter budget name"
          className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          {...register('name')}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="period" className="text-sm font-medium text-[#1a2332]">
          Period *
        </label>
        <input
          id="period"
          placeholder="e.g., Q1 2025, FY 2025"
          className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          {...register('period')}
        />
        {errors.period && <p className="text-sm text-red-600">{errors.period.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="responsible" className="text-sm font-medium text-[#1a2332]">
          Responsible *
        </label>
        <input
          id="responsible"
          placeholder="Enter responsible person"
          className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          {...register('responsible')}
        />
        {errors.responsible && <p className="text-sm text-red-600">{errors.responsible.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="plannedAmount" className="text-sm font-medium text-[#1a2332]">
          Planned Amount (₹) *
        </label>
        <input
          id="plannedAmount"
          type="number"
          step="0.01"
          placeholder="0.00"
          className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          {...register('plannedAmount', { valueAsNumber: true })}
        />
        {errors.plannedAmount && <p className="text-sm text-red-600">{errors.plannedAmount.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="analyticAccountId" className="text-sm font-medium text-[#1a2332]">
          Analytic Account *
        </label>
        <select
          id="analyticAccountId"
          {...register('analyticAccountId')}
          className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          disabled={loadingAccounts}
        >
          <option value="">Select an analytic account</option>
          {analyticAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.type})
            </option>
          ))}
        </select>
        {errors.analyticAccountId && <p className="text-sm text-red-600">{errors.analyticAccountId.message}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[#e5e7eb]">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
          {isSubmitting
            ? 'Saving...'
            : initialData
            ? 'Save Changes'
            : 'Save Budget'}
        </Button>
      </div>
    </form>
  );
};
