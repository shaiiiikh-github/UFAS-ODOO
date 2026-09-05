import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import type { Journal, JournalInput, JournalType } from '@/types/journal';

const journalSchema = z.object({
  name: z.string().min(1, 'Journal name is required'),
  type: z.enum(['sales', 'purchase', 'bank', 'cash']),
});

type JournalFormData = z.infer<typeof journalSchema>;

interface JournalFormProps {
  initialData?: Journal | null;
  onSubmit: (data: JournalInput) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const JournalForm: React.FC<JournalFormProps> = ({
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
  } = useForm<JournalFormData>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'sales',
    },
  });

  const typeValue = useWatch({ control, name: 'type' });

  const handleFormSubmit = (data: JournalFormData) => {
    onSubmit({
      name: data.name,
      type: data.type as JournalType,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium text-[#1a2332]">
          Journal Name *
        </label>
        <input
          id="name"
          placeholder="Enter journal name"
          className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          {...register('name')}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="type" className="text-sm font-medium text-[#1a2332]">
          Journal Type *
        </label>
        <select
          id="type"
          value={typeValue}
          onChange={(e) => setValue('type', e.target.value as JournalFormData['type'])}
          className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
        >
          <option value="sales">Sales</option>
          <option value="purchase">Purchase</option>
          <option value="bank">Bank</option>
          <option value="cash">Cash</option>
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
            : 'Save Journal'}
        </Button>
      </div>
    </form>
  );
};
