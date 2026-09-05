import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useEligibleInvoices } from '@/hooks/useCustomerPayments';
import { formatCurrency } from '@/lib/format';
import type {
  CustomerPayment,
  CustomerPaymentInput,
  PaymentMethod,
} from '@/types/customerPayment';

const paymentSchema = z.object({
  paymentDate: z.string().min(1, 'Payment date is required'),
  customerInvoiceId: z.string().min(1, 'Please select an invoice'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['Cash', 'Bank', 'UPI', 'Cheque', 'Other']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface CustomerPaymentFormProps {
  initialData?: CustomerPayment | null;
  onSubmit: (data: CustomerPaymentInput) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const CustomerPaymentForm: React.FC<CustomerPaymentFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const {
    data: invoices = [],
    isLoading: loadingInvoices,
  } = useEligibleInvoices();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentDate:
        initialData?.paymentDate ||
        new Date().toISOString().split('T')[0],
      customerInvoiceId: initialData?.customerInvoiceId || '',
      amount: initialData?.amount || 0,
      paymentMethod: initialData?.paymentMethod || 'Cash',
      reference: initialData?.reference || '',
      notes: initialData?.notes || '',
    },
  });

  const watchInvoiceId = useWatch({
    control,
    name: 'customerInvoiceId',
  });

  const watchAmount = useWatch({
    control,
    name: 'amount',
  });

  const selectedInvoice =
    invoices.find((invoice) => invoice.id === watchInvoiceId) ?? null;

  const maxAmount = selectedInvoice?.balanceDue ?? 0;

  const handleFormSubmit = (data: PaymentFormData) => {
    if (!selectedInvoice) {
      return;
    }

    onSubmit({
      paymentDate: data.paymentDate,
      customerId: selectedInvoice.customerId,
      customerInvoiceId: data.customerInvoiceId,
      amount: data.amount,
      paymentMethod: data.paymentMethod as PaymentMethod,
      reference: data.reference || '',
      notes: data.notes || '',
    });
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <label
          htmlFor="paymentDate"
          className="text-sm font-medium text-[#1a2332]"
        >
          Payment Date *
        </label>

        <input
          id="paymentDate"
          type="date"
          className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          {...register('paymentDate')}
        />

        {errors.paymentDate && (
          <p className="text-sm text-red-600">
            {errors.paymentDate.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="customerInvoiceId"
          className="text-sm font-medium text-[#1a2332]"
        >
          Customer Invoice *
        </label>

        <select
          id="customerInvoiceId"
          {...register('customerInvoiceId', {
            onChange: (event) => {
              const invoice = invoices.find(
                (item) => item.id === event.target.value
              );

              if (invoice && (!watchAmount || watchAmount === 0)) {
                setValue('amount', invoice.balanceDue);
              }
            },
          })}
          className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          disabled={loadingInvoices}
        >
          <option value="">Select an invoice</option>

          {invoices.map((invoice) => (
            <option key={invoice.id} value={invoice.id}>
              {invoice.invoiceNumber} - {invoice.customerName} (Balance:{' '}
              {formatCurrency(invoice.balanceDue)})
            </option>
          ))}
        </select>

        {errors.customerInvoiceId && (
          <p className="text-sm text-red-600">
            {errors.customerInvoiceId.message}
          </p>
        )}
      </div>

      {selectedInvoice && (
        <div className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] p-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-[#6b7280]">Invoice Total</span>
              <div className="font-medium text-[#1a2332]">
                {formatCurrency(selectedInvoice.totalAmount)}
              </div>
            </div>

            <div>
              <span className="text-[#6b7280]">Paid So Far</span>
              <div className="font-medium text-[#1a2332]">
                {formatCurrency(selectedInvoice.paidAmount)}
              </div>
            </div>

            <div className="col-span-2">
              <span className="text-[#6b7280]">Balance Due</span>
              <div className="font-bold text-[#1a2332]">
                {formatCurrency(selectedInvoice.balanceDue)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="amount"
          className="text-sm font-medium text-[#1a2332]"
        >
          Amount *
        </label>

        <input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          {...register('amount', {
            valueAsNumber: true,
            validate: (value) =>
              !selectedInvoice ||
              value <= selectedInvoice.balanceDue ||
              'Amount cannot exceed balance due',
          })}
        />

        {maxAmount > 0 && (
          <p className="text-xs text-[#6b7280]">
            Maximum allowed: {formatCurrency(maxAmount)}
          </p>
        )}

        {errors.amount && (
          <p className="text-sm text-red-600">
            {errors.amount.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="paymentMethod"
          className="text-sm font-medium text-[#1a2332]"
        >
          Payment Method *
        </label>

        <select
          id="paymentMethod"
          {...register('paymentMethod')}
          className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
        >
          <option value="Cash">Cash</option>
          <option value="Bank">Bank</option>
          <option value="UPI">UPI</option>
          <option value="Cheque">Cheque</option>
          <option value="Other">Other</option>
        </select>

        {errors.paymentMethod && (
          <p className="text-sm text-red-600">
            {errors.paymentMethod.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="reference"
          className="text-sm font-medium text-[#1a2332]"
        >
          Reference (optional)
        </label>

        <input
          id="reference"
          placeholder="Cheque/UPI/Bank reference"
          className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          {...register('reference')}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="notes"
          className="text-sm font-medium text-[#1a2332]"
        >
          Notes (optional)
        </label>

        <textarea
          id="notes"
          rows={2}
          className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          {...register('notes')}
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#1a2a3a] hover:bg-[#2a3f56]"
        >
          {isSubmitting
            ? 'Saving...'
            : initialData
              ? 'Save Changes'
              : 'Record Payment'}
        </Button>
      </div>
    </form>
  );
};