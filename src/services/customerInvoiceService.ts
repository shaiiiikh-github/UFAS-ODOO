import type { CustomerInvoice, CustomerInvoiceInput, CustomerInvoiceFilters, CustomerInvoiceItem } from '@/types/customerInvoice';

// Mock customers
const mockCustomers = [
  { id: '1', name: 'Rahul Kumar', type: 'CUSTOMER' },
  { id: '2', name: 'Priya Sharma', type: 'VENDOR' },
  { id: '3', name: 'Arjun Mehta', type: 'BOTH' },
  { id: '4', name: 'Sneha Patel', type: 'CUSTOMER' },
];

// Mock products
const mockProducts = [
  { id: '1', name: 'Office Desk', salesPrice: 25000 },
  { id: '2', name: 'Ergonomic Chair', salesPrice: 12000 },
  { id: '3', name: 'Interior Design Consultation', salesPrice: 5000 },
  { id: '4', name: 'Modular Wardrobe Set', salesPrice: 45000 },
];

// Mock sales orders (for reference)
const mockSalesOrders = [
  { id: '1', orderNumber: 'SO-1001', customerId: '1', status: 'Confirmed' },
  { id: '2', orderNumber: 'SO-1002', customerId: '3', status: 'Draft' }, // not confirmed
];

let nextInvoiceId = 10;
let nextItemId = 20;

const generateInvoiceNumber = () => {
  const prefix = 'INV-';
  const num = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return prefix + num;
};

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
    items: [
      { id: 'i1', productId: '1', productName: 'Office Desk', quantity: 2, unitPrice: 25000, taxRate: 0.18, lineTotal: 50000 },
      { id: 'i2', productId: '2', productName: 'Ergonomic Chair', quantity: 4, unitPrice: 12000, taxRate: 0.18, lineTotal: 48000 },
    ],
    subtotal: 98000,
    taxAmount: 17640,
    totalAmount: 115640,
    paidAmount: 0,
    balanceDue: 115640,
    notes: 'Posted invoice from SO-1001',
  },
  {
    id: '2',
    invoiceNumber: 'INV-1002',
    invoiceDate: '2025-02-05',
    dueDate: '2025-03-05',
    salesOrderId: undefined,
    salesOrderNumber: undefined,
    customerId: '4',
    customerName: 'Sneha Patel',
    status: 'Draft',
    items: [
      { id: 'i3', productId: '4', productName: 'Modular Wardrobe Set', quantity: 1, unitPrice: 45000, taxRate: 0.18, lineTotal: 45000 },
    ],
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
    salesOrderId: undefined,
    salesOrderNumber: undefined,
    customerId: '3',
    customerName: 'Arjun Mehta',
    status: 'Partially Paid',
    items: [
      { id: 'i4', productId: '3', productName: 'Interior Design Consultation', quantity: 1, unitPrice: 5000, taxRate: 0.18, lineTotal: 5000 },
    ],
    subtotal: 5000,
    taxAmount: 900,
    totalAmount: 5900,
    paidAmount: 2000,
    balanceDue: 3900,
    notes: 'Partial payment received',
  },
];

let invoices = [...mockInvoices];
let nextInvoiceIdCounter = invoices.length + 1;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getCustomerName = (customerId: string) => {
  const customer = mockCustomers.find(c => c.id === customerId);
  return customer ? customer.name : '';
};

const getSalesOrderInfo = (salesOrderId?: string) => {
  if (!salesOrderId) return { salesOrderNumber: undefined };
  const so = mockSalesOrders.find(s => s.id === salesOrderId);
  return { salesOrderNumber: so?.orderNumber };
};

const buildInvoiceItems = (items: Omit<CustomerInvoiceItem, 'id' | 'lineTotal'>[]): CustomerInvoiceItem[] => {
  return items.map(item => {
    const product = mockProducts.find(p => p.id === item.productId);
    const productName = product ? product.name : '';
    const lineTotal = item.quantity * item.unitPrice * (1 + (item.taxRate || 0));
    return {
      id: String(nextItemId++),
      productId: item.productId,
      productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate || 0,
      lineTotal: Math.round(lineTotal * 100) / 100,
    };
  });
};

const calculateTotals = (items: CustomerInvoiceItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate), 0);
  const total = subtotal + taxAmount;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalAmount: Math.round(total * 100) / 100,
  };
};

export const customerInvoiceService = {
  getInvoices: async (filters?: CustomerInvoiceFilters): Promise<CustomerInvoice[]> => {
    await delay(500);
    let result = [...invoices];
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(searchLower) ||
        (inv.customerName && inv.customerName.toLowerCase().includes(searchLower)) ||
        (inv.salesOrderNumber && inv.salesOrderNumber.toLowerCase().includes(searchLower))
      );
    }
    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter(inv => inv.status === filters.status);
    }
    if (filters?.customerId) {
      result = result.filter(inv => inv.customerId === filters.customerId);
    }
    if (filters?.fromDate) {
      result = result.filter(inv => inv.invoiceDate >= filters.fromDate!);
    }
    if (filters?.toDate) {
      result = result.filter(inv => inv.invoiceDate <= filters.toDate!);
    }
    return result;
  },

  getInvoice: async (id: string): Promise<CustomerInvoice | undefined> => {
    await delay(300);
    return invoices.find(inv => inv.id === id);
  },

  createInvoice: async (input: CustomerInvoiceInput): Promise<CustomerInvoice> => {
    await delay(600);
    const customerName = getCustomerName(input.customerId);
    const { salesOrderNumber } = getSalesOrderInfo(input.salesOrderId);
    const items = buildInvoiceItems(input.items);
    const totals = calculateTotals(items);
    const newInvoice: CustomerInvoice = {
      id: String(nextInvoiceIdCounter++),
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate,
      salesOrderId: input.salesOrderId,
      salesOrderNumber,
      customerId: input.customerId,
      customerName,
      status: 'Draft',
      items,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      paidAmount: 0,
      balanceDue: totals.totalAmount,
      notes: input.notes || '',
    };
    invoices.push(newInvoice);
    return newInvoice;
  },

  updateInvoice: async (id: string, input: Partial<CustomerInvoiceInput>): Promise<CustomerInvoice> => {
    await delay(600);
    const index = invoices.findIndex(inv => inv.id === id);
    if (index === -1) throw new Error('Invoice not found');
    const existing = invoices[index];
    if (existing.status !== 'Draft') {
      throw new Error('Only Draft invoices can be edited.');
    }
    const updated = { ...existing };
    if (input.customerId) {
      updated.customerId = input.customerId;
      updated.customerName = getCustomerName(input.customerId);
    }
    if (input.salesOrderId !== undefined) {
      updated.salesOrderId = input.salesOrderId;
      const { salesOrderNumber } = getSalesOrderInfo(input.salesOrderId);
      updated.salesOrderNumber = salesOrderNumber;
    }
    if (input.invoiceDate) updated.invoiceDate = input.invoiceDate;
    if (input.dueDate !== undefined) updated.dueDate = input.dueDate;
    if (input.items) {
      const items = buildInvoiceItems(input.items);
      updated.items = items;
      const totals = calculateTotals(items);
      updated.subtotal = totals.subtotal;
      updated.taxAmount = totals.taxAmount;
      updated.totalAmount = totals.totalAmount;
      updated.paidAmount = 0;
      updated.balanceDue = totals.totalAmount;
    }
    if (input.notes !== undefined) updated.notes = input.notes;
    invoices[index] = updated;
    return updated;
  },

  postInvoice: async (id: string): Promise<CustomerInvoice> => {
    await delay(500);
    const index = invoices.findIndex(inv => inv.id === id);
    if (index === -1) throw new Error('Invoice not found');
    const invoice = invoices[index];
    if (invoice.status !== 'Draft') {
      throw new Error('Only Draft invoices can be posted.');
    }
    invoice.status = 'Posted';
    invoices[index] = invoice;
    return invoice;
  },

  cancelInvoice: async (id: string): Promise<CustomerInvoice> => {
    await delay(500);
    const index = invoices.findIndex(inv => inv.id === id);
    if (index === -1) throw new Error('Invoice not found');
    const invoice = invoices[index];
    if (invoice.status === 'Cancelled') {
      throw new Error('Invoice already cancelled.');
    }
    invoice.status = 'Cancelled';
    invoices[index] = invoice;
    return invoice;
  },
};