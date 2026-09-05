import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import type { Account, AccountInput, AccountType } from '@/types/account';

const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['asset', 'liability', 'expense', 'income', 'capital']),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface AccountFormProps {
  initialData?: Account | null;
  onSubmit: (data: AccountInput) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const AccountForm: React.FC<AccountFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'asset',
    },
  });

  const typeValue = useWatch({ control, name: 'type' });

  const handleFormSubmit = (data: AccountFormData) => {
    onSubmit({
      name: data.name,
      type: data.type as AccountType,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium text-[#1a2332]">
          Account Name *
        </label>
        <input
          id="name"
          placeholder="Enter account name"
          className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          {...register('name')}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="type" className="text-sm font-medium text-[#1a2332]">
          Account Type *
        </label>
        <select
          id="type"
          value={typeValue}
          onChange={(e) => setValue('type', e.target.value as AccountFormData['type'])}
          className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
        >
          <option value="asset">Asset</option>
          <option value="liability">Liability</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="capital">Capital</option>
        </select>
        {errors.type && <p className="text-sm text-red-600">{errors.type.message}</p>}
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
            : 'Save Account'}
        </Button>
      </div>
    </form>
  );
};
