export type VendorPaymentMethod = 'Cash' | 'Bank' | 'UPI' | 'Cheque' | 'Other';
export type VendorPaymentStatus = 'Draft' | 'Posted' | 'Cancelled';
export interface VendorPayment { id: string; paymentNumber: string; paymentDate: string; vendorId: string; vendorName?: string; vendorBillId: string; billNumber?: string; amount: number; paymentMethod: VendorPaymentMethod; reference?: string; notes?: string; status: VendorPaymentStatus; }
export type VendorPaymentInput = Omit<VendorPayment, 'id' | 'vendorId' | 'vendorName' | 'billNumber' | 'status'>;
export interface VendorPaymentFilters { search?: string; status?: VendorPaymentStatus | 'ALL'; vendorId?: string; paymentMethod?: VendorPaymentMethod | 'ALL'; fromDate?: string; toDate?: string; }
