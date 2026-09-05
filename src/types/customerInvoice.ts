export type CustomerInvoiceStatus = 'Draft' | 'Posted' | 'Partially Paid' | 'Paid' | 'Cancelled';

export interface CustomerInvoiceItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
}

export interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  salesOrderId?: string;
  salesOrderNumber?: string;
  customerId: string;
  customerName?: string;
  status: CustomerInvoiceStatus;
  items: CustomerInvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  notes?: string;
}

// Only the fields that the user provides in the form
export type CustomerInvoiceInput = {
  invoiceDate: string;
  dueDate?: string;
  customerId: string;
  salesOrderId?: string;
  items: Omit<CustomerInvoiceItem, 'id' | 'lineTotal'>[];
  notes?: string;
};

export interface CustomerInvoiceFilters {
  search?: string;
  status?: CustomerInvoiceStatus | 'ALL';
  customerId?: string;
  fromDate?: string;
  toDate?: string;
}