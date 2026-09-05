import type { SalesOrder, SalesOrderInput, SalesOrderFilters, SalesOrderItem } from '@/types/salesOrder';

// Mock customers (from contacts mock)
const mockCustomers = [
  { id: '1', name: 'Rahul Kumar', type: 'CUSTOMER' },
  { id: '2', name: 'Priya Sharma', type: 'VENDOR' },
  { id: '3', name: 'Arjun Mehta', type: 'BOTH' },
  { id: '4', name: 'Sneha Patel', type: 'CUSTOMER' },
];

// Mock products (from products mock)
const mockProducts = [
  { id: '1', name: 'Office Desk', salesPrice: 25000 },
  { id: '2', name: 'Ergonomic Chair', salesPrice: 12000 },
  { id: '3', name: 'Interior Design Consultation', salesPrice: 5000 },
  { id: '4', name: 'Modular Wardrobe Set', salesPrice: 45000 },
];

const generateOrderNumber = () => {
  const prefix = 'SO-';
  const num = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return prefix + num;
};

const mockOrders: SalesOrder[] = [
  {
    id: '1',
    orderNumber: 'SO-1001',
    orderDate: '2025-01-15',
    customerId: '1',
    customerName: 'Rahul Kumar',
    status: 'Confirmed',
    items: [
      { id: 'i1', productId: '1', productName: 'Office Desk', quantity: 2, unitPrice: 25000, taxRate: 0.18, lineTotal: 50000 },
      { id: 'i2', productId: '2', productName: 'Ergonomic Chair', quantity: 4, unitPrice: 12000, taxRate: 0.18, lineTotal: 48000 },
    ],
    subtotal: 98000,
    taxAmount: 17640,
    totalAmount: 115640,
    notes: 'Deliver to office address.',
  },
  {
    id: '2',
    orderNumber: 'SO-1002',
    orderDate: '2025-01-20',
    customerId: '3',
    customerName: 'Arjun Mehta',
    status: 'Draft',
    items: [
      { id: 'i3', productId: '3', productName: 'Interior Design Consultation', quantity: 1, unitPrice: 5000, taxRate: 0.18, lineTotal: 5000 },
    ],
    subtotal: 5000,
    taxAmount: 900,
    totalAmount: 5900,
    notes: '',
  },
  {
    id: '3',
    orderNumber: 'SO-1003',
    orderDate: '2025-01-25',
    customerId: '4',
    customerName: 'Sneha Patel',
    status: 'Cancelled',
    items: [
      { id: 'i4', productId: '4', productName: 'Modular Wardrobe Set', quantity: 1, unitPrice: 45000, taxRate: 0.18, lineTotal: 45000 },
    ],
    subtotal: 45000,
    taxAmount: 8100,
    totalAmount: 53100,
    notes: 'Cancelled due to customer request.',
  },
];

const orders = [...mockOrders];
let nextOrderId = orders.length + 1;
let nextItemId = 10;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getCustomerName = (customerId: string) => {
  const customer = mockCustomers.find(c => c.id === customerId);
  return customer ? customer.name : '';
};

const buildOrderItems = (items: Omit<SalesOrderItem, 'id' | 'lineTotal'>[]): SalesOrderItem[] => {
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

const calculateTotals = (items: SalesOrderItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate), 0);
  const total = subtotal + taxAmount;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalAmount: Math.round(total * 100) / 100,
  };
};

export const salesOrderService = {
  getSalesOrders: async (filters?: SalesOrderFilters): Promise<SalesOrder[]> => {
    await delay(500);
    let result = [...orders];

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(o =>
        o.orderNumber.toLowerCase().includes(searchLower) ||
        (o.customerName && o.customerName.toLowerCase().includes(searchLower))
      );
    }

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter(o => o.status === filters.status);
    }

    if (filters?.customerId) {
      result = result.filter(o => o.customerId === filters.customerId);
    }

    if (filters?.fromDate) {
      result = result.filter(o => o.orderDate >= filters.fromDate!);
    }

    if (filters?.toDate) {
      result = result.filter(o => o.orderDate <= filters.toDate!);
    }

    return result;
  },

  getSalesOrder: async (id: string): Promise<SalesOrder | undefined> => {
    await delay(300);
    return orders.find(o => o.id === id);
  },

  createSalesOrder: async (input: SalesOrderInput): Promise<SalesOrder> => {
    await delay(600);
    const customerName = getCustomerName(input.customerId);
    const items = buildOrderItems(input.items);
    const totals = calculateTotals(items);
    const newOrder: SalesOrder = {
      id: String(nextOrderId++),
      orderNumber: generateOrderNumber(),
      orderDate: input.orderDate,
      customerId: input.customerId,
      customerName,
      status: 'Draft',
      items,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      notes: input.notes || '',
    };
    orders.push(newOrder);
    return newOrder;
  },

  updateSalesOrder: async (id: string, input: Partial<SalesOrderInput>): Promise<SalesOrder> => {
    await delay(600);
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Sales order not found');
    const existing = orders[index];
    if (existing.status !== 'Draft') {
      throw new Error('Only Draft orders can be edited.');
    }

    const updated = { ...existing };
    if (input.customerId) {
      updated.customerId = input.customerId;
      updated.customerName = getCustomerName(input.customerId);
    }
    if (input.orderDate) updated.orderDate = input.orderDate;
    if (input.items) {
      const items = buildOrderItems(input.items);
      updated.items = items;
      const totals = calculateTotals(items);
      updated.subtotal = totals.subtotal;
      updated.taxAmount = totals.taxAmount;
      updated.totalAmount = totals.totalAmount;
    }
    if (input.notes !== undefined) updated.notes = input.notes;

    orders[index] = updated;
    return updated;
  },

  confirmSalesOrder: async (id: string): Promise<SalesOrder> => {
    await delay(500);
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Sales order not found');
    const order = orders[index];
    if (order.status !== 'Draft') {
      throw new Error('Only Draft orders can be confirmed.');
    }
    order.status = 'Confirmed';
    orders[index] = order;
    return order;
  },

  cancelSalesOrder: async (id: string): Promise<SalesOrder> => {
    await delay(500);
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Sales order not found');
    const order = orders[index];
    if (order.status === 'Cancelled') {
      throw new Error('Order is already cancelled.');
    }
    order.status = 'Cancelled';
    orders[index] = order;
    return order;
  },

  deleteSalesOrder: async (id: string): Promise<void> => {
    await delay(400);
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Sales order not found');
    const order = orders[index];
    if (order.status !== 'Draft') {
      throw new Error('Only Draft orders can be deleted.');
    }
    orders.splice(index, 1);
  },
};
