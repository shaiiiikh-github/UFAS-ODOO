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

// Only the fields that the user provides in the form
export type SalesOrderInput = {
  orderDate: string;
  customerId: string;
  items: Omit<SalesOrderItem, 'id' | 'lineTotal'>[];
  notes?: string;
};

export interface SalesOrderFilters {
  search?: string;
  status?: SalesOrderStatus | 'ALL';
  customerId?: string;
  fromDate?: string;
  toDate?: string;
}