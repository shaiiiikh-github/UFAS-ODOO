import { contactService } from '@/services/contactService';
import { productService } from '@/services/productService';
import type { PurchaseOrder, PurchaseOrderFilters, PurchaseOrderInput, PurchaseOrderItem } from '@/types/purchaseOrder';

let orders: PurchaseOrder[] = [
  { id: 'po-1', orderNumber: 'PO-1001', orderDate: '2025-02-03', vendorId: '2', vendorName: 'Priya Sharma', status: 'Confirmed', items: [{ id: 'poi-1', productId: '1', productName: 'Office Desk', quantity: 3, unitPrice: 18000, taxRate: 0.18, lineTotal: 63720 }], subtotal: 54000, taxAmount: 9720, totalAmount: 63720, notes: 'Deliver to warehouse.' },
  { id: 'po-2', orderNumber: 'PO-1002', orderDate: '2025-02-10', vendorId: '5', vendorName: 'Vikram Singh', status: 'Draft', items: [{ id: 'poi-2', productId: '2', productName: 'Ergonomic Chair', quantity: 6, unitPrice: 8500, taxRate: 0.18, lineTotal: 60180 }], subtotal: 51000, taxAmount: 9180, totalAmount: 60180 },
];
let nextId = 3;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const round = (value: number) => Math.round(value * 100) / 100;

const buildItems = async (inputItems: PurchaseOrderInput['items']): Promise<PurchaseOrderItem[]> => {
  const products = await productService.getProducts();
  return inputItems.map((item, index) => ({
    ...item,
    id: `poi-${Date.now()}-${index}`,
    productName: products.find(product => product.id === item.productId)?.name ?? '',
    taxRate: item.taxRate || 0,
    lineTotal: round(item.quantity * item.unitPrice * (1 + (item.taxRate || 0))),
  }));
};
const totalsFor = (items: PurchaseOrderItem[]) => {
  const subtotal = round(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  const taxAmount = round(items.reduce((sum, item) => sum + item.quantity * item.unitPrice * item.taxRate, 0));
  return { subtotal, taxAmount, totalAmount: round(subtotal + taxAmount) };
};

export const purchaseOrderService = {
  async getPurchaseOrders(filters?: PurchaseOrderFilters) {
    await delay(250);
    return orders.filter(order => {
      const search = filters?.search?.toLowerCase();
      return (!search || order.orderNumber.toLowerCase().includes(search) || order.vendorName?.toLowerCase().includes(search))
        && (!filters?.status || filters.status === 'ALL' || order.status === filters.status)
        && (!filters?.vendorId || order.vendorId === filters.vendorId)
        && (!filters?.fromDate || order.orderDate >= filters.fromDate)
        && (!filters?.toDate || order.orderDate <= filters.toDate);
    });
  },
  async createPurchaseOrder(input: PurchaseOrderInput) {
    await delay(300);
    const contacts = await contactService.getContacts();
    const vendor = contacts.find(contact => contact.id === input.vendorId);
    if (!vendor || !['VENDOR', 'BOTH'].includes(vendor.type)) throw new Error('Select a valid vendor.');
    const items = await buildItems(input.items);
    const order: PurchaseOrder = { id: `po-${nextId++}`, orderNumber: input.orderNumber, orderDate: input.orderDate, vendorId: input.vendorId, vendorName: vendor.name, status: 'Draft', items, ...totalsFor(items), notes: input.notes || '' };
    orders = [...orders, order];
    return order;
  },
  async updatePurchaseOrder(id: string, input: PurchaseOrderInput) {
    await delay(300);
    const existing = orders.find(order => order.id === id);
    if (!existing) throw new Error('Purchase order not found.');
    if (existing.status !== 'Draft') throw new Error('Only draft purchase orders can be edited.');
    const contacts = await contactService.getContacts();
    const vendor = contacts.find(contact => contact.id === input.vendorId);
    if (!vendor || !['VENDOR', 'BOTH'].includes(vendor.type)) throw new Error('Select a valid vendor.');
    const items = await buildItems(input.items);
    const updated = { ...existing, ...input, vendorName: vendor.name, items, ...totalsFor(items) };
    orders = orders.map(order => order.id === id ? updated : order);
    return updated;
  },
  async confirmPurchaseOrder(id: string) {
    await delay(250);
    const order = orders.find(item => item.id === id);
    if (!order || order.status !== 'Draft') throw new Error('Only draft purchase orders can be confirmed.');
    const updated = { ...order, status: 'Confirmed' as const };
    orders = orders.map(item => item.id === id ? updated : item);
    return updated;
  },
  async cancelPurchaseOrder(id: string) {
    await delay(250);
    const order = orders.find(item => item.id === id);
    if (!order || order.status === 'Cancelled') throw new Error('Purchase order cannot be cancelled.');
    const updated = { ...order, status: 'Cancelled' as const };
    orders = orders.map(item => item.id === id ? updated : item);
    return updated;
  },
};
