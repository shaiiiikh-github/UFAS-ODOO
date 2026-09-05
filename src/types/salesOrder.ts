export type SalesOrderStatus = 'Draft' | 'Confirmed' | 'Cancelled';

export interface SalesOrderItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  customerId: string;
  customerName?: string;
  status: SalesOrderStatus;
  items: SalesOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
}

export type SalesOrderInput = Omit<SalesOrder, 'id' | 'orderNumber' | 'customerName'> & {
  customerId: string;
  items: Omit<SalesOrderItem, 'id' | 'lineTotal'>[];
};

export interface SalesOrderFilters {
  search?: string;
  status?: SalesOrderStatus | 'ALL';
  customerId?: string;
  fromDate?: string;
  toDate?: string;
}