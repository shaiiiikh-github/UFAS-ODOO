import type {
  CustomerPayment,
  CustomerPaymentInput,
  CustomerPaymentFilters,
} from '@/types/customerPayment';
import type { CustomerInvoice } from '@/types/customerInvoice';

// Mock invoices (to get invoice data)
const mockInvoices: CustomerInvoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-1001',
    invoiceDate: '2025-01-20',
    dueDate: '2025-02-20',
    salesOrderId: '1',
    salesOrderNumber: 'SO-1001',
    customerId: '1',
    customerName: 'Rahul Kumar',
    status: 'Posted',
    items: [],
    subtotal: 98000,
    taxAmount: 17640,
    totalAmount: 115640,
    paidAmount: 0,
    balanceDue: 115640,
    notes: '',
  },
  {
    id: '2',
    invoiceNumber: 'INV-1002',
    invoiceDate: '2025-02-05',
    dueDate: '2025-03-05',
    customerId: '4',
    customerName: 'Sneha Patel',
    status: 'Posted',
    items: [],
    subtotal: 45000,
    taxAmount: 8100,
    totalAmount: 53100,
    paidAmount: 0,
    balanceDue: 53100,
    notes: '',
  },
  {
    id: '3',
    invoiceNumber: 'INV-1003',
    invoiceDate: '2025-02-10',
    dueDate: '2025-03-10',
    customerId: '3',
    customerName: 'Arjun Mehta',
    status: 'Partially Paid',
    items: [],
    subtotal: 5000,
    taxAmount: 900,
    totalAmount: 5900,
    paidAmount: 2000,
    balanceDue: 3900,
    notes: '',
  },
  {
    id: '4',
    invoiceNumber: 'INV-1004',
    invoiceDate: '2025-02-15',
    dueDate: '2025-03-15',
    customerId: '1',
    customerName: 'Rahul Kumar',
    status: 'Paid',
    items: [],
    subtotal: 30000,
    taxAmount: 5400,
    totalAmount: 35400,
    paidAmount: 35400,
    balanceDue: 0,
    notes: '',
  },
];

// Mock payments
const mockPayments: CustomerPayment[] = [
  {
    id: '1',
    paymentNumber: 'PMT-0001',
    paymentDate: '2025-01-25',
    customerId: '1',
    customerName: 'Rahul Kumar',
    customerInvoiceId: '1',
    invoiceNumber: 'INV-1001',
    amount: 50000,
    paymentMethod: 'Bank',
    reference: 'NEFT-123456',
    notes: 'Partial payment',
    status: 'Posted',
  },
  {
    id: '2',
    paymentNumber: 'PMT-0002',
    paymentDate: '2025-02-12',
    customerId: '3',
    customerName: 'Arjun Mehta',
    customerInvoiceId: '3',
    invoiceNumber: 'INV-1003',
    amount: 2000,
    paymentMethod: 'Cash',
    reference: '',
    notes: 'Partial payment',
    status: 'Posted',
  },
];

const payments = [...mockPayments];
let nextPaymentId = payments.length + 1;
let nextPaymentNumber = 3; // for PMT-0003

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to get invoice details
const getInvoiceDetails = (invoiceId: string) => {
  const invoice = mockInvoices.find(inv => inv.id === invoiceId);
  if (!invoice) throw new Error('Invoice not found');
  return invoice;
};

const generatePaymentNumber = () => {
  const prefix = 'PMT-';
  const num = String(nextPaymentNumber++).padStart(4, '0');
  return prefix + num;
};

export const customerPaymentService = {
  // Get all payments with filters
  getPayments: async (filters?: CustomerPaymentFilters): Promise<CustomerPayment[]> => {
    await delay(500);
    let result = [...payments];

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(p =>
        p.paymentNumber.toLowerCase().includes(searchLower) ||
        (p.customerName && p.customerName.toLowerCase().includes(searchLower)) ||
        (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(searchLower)) ||
        (p.reference && p.reference.toLowerCase().includes(searchLower))
      );
    }

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter(p => p.status === filters.status);
    }

    if (filters?.customerId) {
      result = result.filter(p => p.customerId === filters.customerId);
    }

    if (filters?.paymentMethod && filters.paymentMethod !== 'ALL') {
      result = result.filter(p => p.paymentMethod === filters.paymentMethod);
    }

    if (filters?.fromDate) {
      result = result.filter(p => p.paymentDate >= filters.fromDate!);
    }

    if (filters?.toDate) {
      result = result.filter(p => p.paymentDate <= filters.toDate!);
    }

    return result;
  },

  // Get a single payment
  getPayment: async (id: string): Promise<CustomerPayment | undefined> => {
    await delay(300);
    return payments.find(p => p.id === id);
  },

  // Get eligible invoices for payment (Posted or Partially Paid with balance > 0)
  getEligibleInvoices: async (): Promise<CustomerInvoice[]> => {
    await delay(400);
    return mockInvoices.filter(inv =>
      (inv.status === 'Posted' || inv.status === 'Partially Paid') && inv.balanceDue > 0
    );
  },

  // Create payment
  createPayment: async (input: CustomerPaymentInput): Promise<CustomerPayment> => {
    await delay(600);
    // Validate invoice
    const invoice = getInvoiceDetails(input.customerInvoiceId);
    if (invoice.balanceDue < input.amount) {
      throw new Error('Payment amount exceeds the invoice balance due.');
    }
    const newPayment: CustomerPayment = {
      id: String(nextPaymentId++),
      paymentNumber: generatePaymentNumber(),
      paymentDate: input.paymentDate,
      customerId: input.customerId,
      customerName: invoice.customerName,
      customerInvoiceId: input.customerInvoiceId,
      invoiceNumber: invoice.invoiceNumber,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      reference: input.reference || '',
      notes: input.notes || '',
      status: 'Draft',
    };
    payments.push(newPayment);
    return newPayment;
  },

  // Update payment (only Draft)
  updatePayment: async (id: string, input: Partial<CustomerPaymentInput>): Promise<CustomerPayment> => {
    await delay(600);
    const index = payments.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Payment not found');
    const existing = payments[index];
    if (existing.status !== 'Draft') {
      throw new Error('Only Draft payments can be edited.');
    }
    const updated = { ...existing };
    if (input.paymentDate) updated.paymentDate = input.paymentDate;
    if (input.customerInvoiceId) {
      // Validate invoice
      const invoice = getInvoiceDetails(input.customerInvoiceId);
      updated.customerInvoiceId = input.customerInvoiceId;
      updated.invoiceNumber = invoice.invoiceNumber;
      updated.customerId = invoice.customerId;
      updated.customerName = invoice.customerName;
    }
    if (input.amount !== undefined) {
      // Validate against invoice
      const invoice = getInvoiceDetails(updated.customerInvoiceId);
      if (invoice.balanceDue < input.amount) {
        throw new Error('Payment amount exceeds the invoice balance due.');
      }
      updated.amount = input.amount;
    }
    if (input.paymentMethod) updated.paymentMethod = input.paymentMethod;
    if (input.reference !== undefined) updated.reference = input.reference;
    if (input.notes !== undefined) updated.notes = input.notes;
    payments[index] = updated;
    return updated;
  },

  // Post payment
  postPayment: async (id: string): Promise<CustomerPayment> => {
    await delay(500);
    const index = payments.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Payment not found');
    const payment = payments[index];
    if (payment.status !== 'Draft') {
      throw new Error('Only Draft payments can be posted.');
    }
    payment.status = 'Posted';
    payments[index] = payment;
    // Update invoice balance
    const invoice = mockInvoices.find(inv => inv.id === payment.customerInvoiceId);
    if (invoice) {
      invoice.paidAmount += payment.amount;
      invoice.balanceDue = invoice.totalAmount - invoice.paidAmount;
      if (invoice.balanceDue === 0) {
        invoice.status = 'Paid';
      } else {
        invoice.status = 'Partially Paid';
      }
    }
    return payment;
  },

  // Cancel payment
  cancelPayment: async (id: string): Promise<CustomerPayment> => {
    await delay(500);
    const index = payments.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Payment not found');
    const payment = payments[index];
    if (payment.status === 'Cancelled') {
      throw new Error('Payment already cancelled.');
    }
    
    // Store original status before changing
    const wasPosted = payment.status === 'Posted';
    
    // Change status to Cancelled
    payment.status = 'Cancelled';
    payments[index] = payment;
    
    // Reverse the payment effect on the invoice if it was Posted
    if (wasPosted) {
      const invoice = mockInvoices.find(inv => inv.id === payment.customerInvoiceId);
      if (invoice) {
        invoice.paidAmount -= payment.amount;
        invoice.balanceDue = invoice.totalAmount - invoice.paidAmount;
        if (invoice.balanceDue === 0) {
          invoice.status = 'Paid';
        } else if (invoice.paidAmount === 0) {
          invoice.status = 'Posted';
        } else {
          invoice.status = 'Partially Paid';
        }
      }
    }
    
    return payment;
  },
};
