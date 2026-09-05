export type PurchaseOrderStatus = 'Draft' | 'Confirmed' | 'Cancelled';

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  vendorId: string;
  vendorName?: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
}

export type PurchaseOrderInput = {
  orderNumber: string;
  orderDate: string;
  vendorId: string;
  items: Omit<PurchaseOrderItem, 'id' | 'lineTotal'>[];
  notes?: string;
};

export interface PurchaseOrderFilters {
  search?: string;
  status?: PurchaseOrderStatus | 'ALL';
  vendorId?: string;
  fromDate?: string;
  toDate?: string;
}
