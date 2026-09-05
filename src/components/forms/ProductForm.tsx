import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import type { Product, ProductInput } from '@/types/product';

// Schema with required fields (no defaults, to keep type inference clean)
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  type: z.enum(['goods', 'service', 'combo']),
  category: z.string().optional(),
  salesPrice: z.number().min(0, 'Price cannot be negative'),
  costPrice: z.number().min(0, 'Price cannot be negative'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: ProductInput) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
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
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: (initialData?.type as ProductFormData['type']) || 'goods',
      category: initialData?.category || '',
      salesPrice: initialData?.salesPrice ?? 0,
      costPrice: initialData?.costPrice ?? 0,
    },
  });

  const typeValue = useWatch({ control, name: 'type' });

  const handleFormSubmit = (data: ProductFormData) => {
    onSubmit({
      name: data.name,
      type: data.type,
      category: data.category || '',
      salesPrice: data.salesPrice,
      costPrice: data.costPrice,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium text-[#1a2332]">
          Product Name *
        </label>
        <input
          id="name"
          placeholder="Enter product name"
          className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          {...register('name')}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="type" className="text-sm font-medium text-[#1a2332]">
          Type *
        </label>
        <select
          id="type"
          value={typeValue}
          onChange={(e) => setValue('type', e.target.value as ProductFormData['type'])}
          className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
        >
          <option value="goods">Goods</option>
          <option value="service">Service</option>
          <option value="combo">Combo</option>
        </select>
        {errors.type && <p className="text-sm text-red-600">{errors.type.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="category" className="text-sm font-medium text-[#1a2332]">
          Category
        </label>
        <input
          id="category"
          placeholder="Enter category"
          className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          {...register('category')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="salesPrice" className="text-sm font-medium text-[#1a2332]">
            Sales Price (₹)
          </label>
          <input
            id="salesPrice"
            type="number"
            step="0.01"
            placeholder="0.00"
            className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
            {...register('salesPrice', { valueAsNumber: true })}
          />
          {errors.salesPrice && <p className="text-sm text-red-600">{errors.salesPrice.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="costPrice" className="text-sm font-medium text-[#1a2332]">
            Cost / Purchase Price (₹)
          </label>
          <input
            id="costPrice"
            type="number"
            step="0.01"
            placeholder="0.00"
            className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
            {...register('costPrice', { valueAsNumber: true })}
          />
          {errors.costPrice && <p className="text-sm text-red-600">{errors.costPrice.message}</p>}
        </div>
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
            : 'Save Product'}
        </Button>
      </div>
    </form>
  );
};
