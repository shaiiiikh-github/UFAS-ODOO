import type { PurchaseOrderItem } from '@/types/purchaseOrder';

export type VendorBillStatus = 'Draft' | 'Posted' | 'Partially Paid' | 'Paid' | 'Cancelled';
export interface VendorBill { id: string; billNumber: string; billDate: string; dueDate?: string; purchaseOrderId?: string; purchaseOrderNumber?: string; vendorId: string; vendorName?: string; status: VendorBillStatus; items: PurchaseOrderItem[]; subtotal: number; taxAmount: number; totalAmount: number; paidAmount: number; balanceDue: number; notes?: string; }
export type VendorBillInput = { billNumber: string; billDate: string; dueDate?: string; purchaseOrderId?: string; vendorId: string; items: Omit<PurchaseOrderItem, 'id' | 'lineTotal'>[]; notes?: string; };
export interface VendorBillFilters { search?: string; status?: VendorBillStatus | 'ALL'; vendorId?: string; fromDate?: string; toDate?: string; }
