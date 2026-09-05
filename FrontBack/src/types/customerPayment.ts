export type PaymentMethod = 'Cash' | 'Bank' | 'UPI' | 'Cheque' | 'Other';
export type CustomerPaymentStatus = 'Draft' | 'Posted' | 'Cancelled';

export interface CustomerPayment {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  customerId: string;
  customerName?: string;
  customerInvoiceId: string;
  invoiceNumber?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  status: CustomerPaymentStatus;
}

// Input type excludes fields that are auto-generated (id, paymentNumber, customerName, invoiceNumber, status)
export type CustomerPaymentInput = Omit<CustomerPayment, 'id' | 'paymentNumber' | 'customerName' | 'invoiceNumber' | 'status'>;

export interface CustomerPaymentFilters {
  search?: string;
  status?: CustomerPaymentStatus | 'ALL';
  customerId?: string;
  paymentMethod?: PaymentMethod | 'ALL';
  fromDate?: string;
  toDate?: string;
}