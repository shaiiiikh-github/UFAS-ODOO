import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { useContacts } from '@/hooks/useContacts';
import { useProducts } from '@/hooks/useProducts';
import type { PurchaseOrder, PurchaseOrderInput } from '@/types/purchaseOrder';

const itemSchema = z.object({ productId: z.string().min(1, 'Product is required'), quantity: z.number().positive('Quantity must be greater than 0'), unitPrice: z.number().min(0, 'Unit price cannot be negative'), taxRate: z.number().min(0, 'Tax rate cannot be negative') });
const schema = z.object({ orderNumber: z.string().min(1, 'Order number is required'), orderDate: z.string().min(1, 'Order date is required'), vendorId: z.string().min(1, 'Vendor is required'), items: z.array(itemSchema).min(1, 'Add at least one item'), notes: z.string().optional() });
type FormValues = z.infer<typeof schema>;
type Props = { initialData?: PurchaseOrder | null; onSubmit: (data: PurchaseOrderInput) => void; onCancel: () => void; isSubmitting: boolean };
const fieldClass = 'w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]';

export function PurchaseOrderForm({ initialData, onSubmit, onCancel, isSubmitting }: Props) {
  const { data: contacts = [] } = useContacts({ type: 'ALL' });
  const { data: products = [] } = useProducts({});
  const vendors = contacts.filter(contact => contact.type === 'VENDOR' || contact.type === 'BOTH');
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { orderNumber: initialData?.orderNumber ?? '', orderDate: initialData?.orderDate ?? new Date().toISOString().slice(0, 10), vendorId: initialData?.vendorId ?? '', items: initialData?.items.map(({ productId, quantity, unitPrice, taxRate }) => ({ productId, quantity, unitPrice, taxRate })) ?? [{ productId: '', quantity: 1, unitPrice: 0, taxRate: 0 }], notes: initialData?.notes ?? '' } });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');
  const subtotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
  const tax = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0) * (item.taxRate || 0), 0);

  return <form className="space-y-5" onSubmit={handleSubmit(data => onSubmit(data))}>
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="space-y-1"><label htmlFor="po-number" className="text-sm font-medium">Order Number *</label><input id="po-number" className={fieldClass} {...register('orderNumber')} />{errors.orderNumber && <p className="text-xs text-red-600">{errors.orderNumber.message}</p>}</div>
      <div className="space-y-1"><label htmlFor="po-date" className="text-sm font-medium">Order Date *</label><input id="po-date" type="date" className={fieldClass} {...register('orderDate')} />{errors.orderDate && <p className="text-xs text-red-600">{errors.orderDate.message}</p>}</div>
      <div className="space-y-1"><label htmlFor="po-vendor" className="text-sm font-medium">Vendor *</label><select id="po-vendor" className={fieldClass} {...register('vendorId')}><option value="">Select a vendor</option>{vendors.map(vendor => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select>{errors.vendorId && <p className="text-xs text-red-600">{errors.vendorId.message}</p>}</div>
    </div>
    <section><div className="mb-2 flex items-center justify-between"><label className="text-sm font-medium">Order Items *</label><Button type="button" size="sm" variant="outline" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, taxRate: 0 })}><Plus className="mr-1 h-4 w-4" />Add Item</Button></div>
      {errors.items?.message && <p className="mb-2 text-xs text-red-600">{errors.items.message}</p>}<div className="overflow-x-auto rounded-md border border-[#e5e7eb]"><table className="min-w-[720px] w-full text-sm"><thead className="bg-[#f9fafb] text-left text-xs uppercase text-[#6b7280]"><tr><th className="p-3">Product</th><th className="p-3">Qty</th><th className="p-3">Unit Price</th><th className="p-3">Tax %</th><th className="p-3 text-right">Line Total</th><th className="p-3"><span className="sr-only">Remove</span></th></tr></thead><tbody>
        {fields.map((field, index) => { const item = items[index]; const total = (item?.quantity || 0) * (item?.unitPrice || 0) * (1 + (item?.taxRate || 0)); return <tr key={field.id} className="border-t border-[#e5e7eb]"><td className="p-2"><select className={fieldClass} {...register(`items.${index}.productId`)} onChange={event => { register(`items.${index}.productId`).onChange(event); const product = products.find(value => value.id === event.target.value); if (product) setValue(`items.${index}.unitPrice`, product.costPrice); }}><option value="">Select product</option>{products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select>{errors.items?.[index]?.productId && <p className="text-xs text-red-600">{errors.items[index]?.productId?.message}</p>}</td><td className="p-2"><input type="number" step="0.01" className="w-20 rounded border p-2" {...register(`items.${index}.quantity`, { valueAsNumber: true })} /></td><td className="p-2"><input type="number" step="0.01" className="w-28 rounded border p-2" {...register(`items.${index}.unitPrice`, { valueAsNumber: true })} /></td><td className="p-2"><input type="number" step="0.01" className="w-20 rounded border p-2" {...register(`items.${index}.taxRate`, { valueAsNumber: true })} /></td><td className="p-2 text-right font-medium">{formatCurrency(total)}</td><td className="p-2 text-center"><button type="button" aria-label="Remove item" disabled={fields.length === 1} onClick={() => remove(index)} className="text-[#6b7280] hover:text-red-600 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></td></tr>; })}
      </tbody><tfoot className="border-t bg-[#f9fafb]"><tr><td colSpan={4} className="p-2 text-right">Subtotal</td><td className="p-2 text-right font-medium">{formatCurrency(subtotal)}</td><td /></tr><tr><td colSpan={4} className="p-2 text-right">Tax</td><td className="p-2 text-right font-medium">{formatCurrency(tax)}</td><td /></tr><tr><td colSpan={4} className="p-2 text-right font-semibold">Total</td><td className="p-2 text-right font-semibold">{formatCurrency(subtotal + tax)}</td><td /></tr></tfoot></table></div>
    </section>
    <div className="space-y-1"><label htmlFor="po-notes" className="text-sm font-medium">Notes</label><textarea id="po-notes" rows={3} className={fieldClass} {...register('notes')} /></div>
    <div className="flex justify-end gap-3 border-t pt-4"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={isSubmitting} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">{isSubmitting ? 'Saving…' : initialData ? 'Save Changes' : 'Create Purchase Order'}</Button></div>
  </form>;
}
