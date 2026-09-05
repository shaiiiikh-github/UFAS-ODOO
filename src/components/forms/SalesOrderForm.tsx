import React from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { SalesOrder, SalesOrderInput, SalesOrderItem } from '@/types/salesOrder';
import { useContacts } from '@/hooks/useContacts';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/format';

const itemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  taxRate: z.number().min(0, 'Tax rate cannot be negative'),
});

const orderSchema = z.object({
  orderDate: z.string().min(1, 'Order date is required'),
  customerId: z.string().min(1, 'Customer is required'),
  items: z.array(itemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface SalesOrderFormProps {
  initialData?: SalesOrder | null;
  onSubmit: (data: SalesOrderInput) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const SalesOrderForm: React.FC<SalesOrderFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const { data: contacts = [] } = useContacts({ type: 'ALL' });
  const { data: products = [] } = useProducts({});

  const customers = contacts.filter(c => c.type === 'CUSTOMER' || c.type === 'BOTH');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      orderDate: initialData?.orderDate || new Date().toISOString().split('T')[0],
      customerId: initialData?.customerId || '',
      items: initialData?.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 0,
      })) || [{ productId: '', quantity: 1, unitPrice: 0, taxRate: 0 }],
      notes: initialData?.notes || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = useWatch({ control, name: 'items' });

  const calculateItemTotal = (item: OrderFormData['items'][number]) => {
    const qty = item?.quantity || 0;
    const price = item?.unitPrice || 0;
    const tax = item?.taxRate || 0;
    return qty * price * (1 + tax);
  };

  const subtotal = watchItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
  const taxAmount = watchItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0) * (item.taxRate || 0), 0);
  const total = subtotal + taxAmount;

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setValue(`items.${index}.unitPrice`, product.salesPrice || 0);
      setValue(`items.${index}.taxRate`, 0.18);
    }
  };

  const handleFormSubmit = (data: OrderFormData) => {
    const items: Omit<SalesOrderItem, 'id' | 'lineTotal'>[] = data.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate || 0,
    }));
    onSubmit({
      orderDate: data.orderDate,
      customerId: data.customerId,
      items,
      notes: data.notes || '',
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="orderDate" className="text-sm font-medium text-[#1a2332]">
            Order Date *
          </label>
          <input
            id="orderDate"
            type="date"
            className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
            {...register('orderDate')}
          />
          {errors.orderDate && <p className="text-sm text-red-600">{errors.orderDate.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="customerId" className="text-sm font-medium text-[#1a2332]">
            Customer *
          </label>
          <select
            id="customerId"
            {...register('customerId')}
            className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          >
            <option value="">Select a customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.customerId && <p className="text-sm text-red-600">{errors.customerId.message}</p>}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-[#1a2332]">Order Items *</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, taxRate: 0 })}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
        </div>
        {errors.items && <p className="text-sm text-red-600 mb-2">{errors.items.message}</p>}
        <div className="border border-[#e5e7eb] rounded-md overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e5e7eb]">
            <thead className="bg-[#f9fafb]">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Product</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Qty</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Unit Price</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Tax %</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-[#6b7280] uppercase tracking-wider">Line Total</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-[#6b7280] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#e5e7eb]">
              {fields.map((field, index) => {
                const item = watchItems[index];
                const lineTotal = item ? calculateItemTotal(item) : 0;
                return (
                  <tr key={field.id} className="hover:bg-[#f9fafb]">
                    <td className="px-3 py-2">
                      <select
                        {...register(`items.${index}.productId`)}
                        onChange={(e) => {
                          register(`items.${index}.productId`).onChange(e);
                          handleProductChange(index, e.target.value);
                        }}
                        className="w-full px-2 py-1 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
                      >
                        <option value="">Select product</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      {errors.items?.[index]?.productId && (
                        <p className="text-xs text-red-600">{errors.items[index]?.productId?.message}</p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        className="w-20 px-2 py-1 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="text-xs text-red-600">{errors.items[index]?.quantity?.message}</p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        className="w-24 px-2 py-1 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
                        {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                      />
                      {errors.items?.[index]?.unitPrice && (
                        <p className="text-xs text-red-600">{errors.items[index]?.unitPrice?.message}</p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        className="w-20 px-2 py-1 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
                        {...register(`items.${index}.taxRate`, { valueAsNumber: true })}
                      />
                      {errors.items?.[index]?.taxRate && (
                        <p className="text-xs text-red-600">{errors.items[index]?.taxRate?.message}</p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-[#1a2332]">
                      {formatCurrency(lineTotal)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-[#6b7280] hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-[#f9fafb]">
              <tr>
                <td colSpan={4} className="px-3 py-2 text-right font-medium text-[#1a2332]">Subtotal</td>
                <td colSpan={2} className="px-3 py-2 text-right font-medium text-[#1a2332]">{formatCurrency(subtotal)}</td>
              </tr>
              <tr>
                <td colSpan={4} className="px-3 py-2 text-right font-medium text-[#1a2332]">Tax</td>
                <td colSpan={2} className="px-3 py-2 text-right font-medium text-[#1a2332]">{formatCurrency(taxAmount)}</td>
              </tr>
              <tr>
                <td colSpan={4} className="px-3 py-2 text-right font-bold text-[#1a2332]">Total</td>
                <td colSpan={2} className="px-3 py-2 text-right font-bold text-[#1a2332]">{formatCurrency(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-[#1a2332]">Notes</label>
        <textarea
          id="notes"
          rows={2}
          className="w-full px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          {...register('notes')}
        />
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
            : 'Create Sales Order'}
        </Button>
      </div>
    </form>
  );
};
