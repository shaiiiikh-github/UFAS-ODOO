import type { UserRole } from '@/types/auth';
export type PortalRole = Extract<UserRole, 'CUSTOMER' | 'VENDOR'>;
export interface PortalInvoice { id: string; number: string; date: string; dueDate?: string; total: number; paid: number; balance: number; status: string; }
export interface PortalPayment { id: string; number: string; date: string; amount: number; method: string; reference?: string; }
export interface PortalOrder { id: string; number: string; date: string; total: number; status: string; }
export interface PortalDashboard { role: PortalRole; openCount: number; outstandingAmount: number; recentOrders: PortalOrder[]; recentPayments: PortalPayment[]; }
