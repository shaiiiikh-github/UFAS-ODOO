import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FileText,
  LayoutDashboard,
  LogIn,
  ReceiptText,
  ShoppingCart,
  LogOut,
  CreditCard,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency } from '@/lib/format';
import {
  usePortalDashboard,
  usePortalInvoices,
  usePortalOrders,
  usePortalPayments,
} from '@/hooks/usePortal';
import { useCreateCustomerPayment } from '@/hooks/useCustomerPayments';
import type { PortalRole } from '@/types/portal';
import type { PaymentMethod } from '@/types/customerPayment';

const links = [
  { path: '/portal', label: 'Overview', icon: LayoutDashboard },
  { path: '/portal/invoices', label: 'Invoices / Bills', icon: FileText },
  { path: '/portal/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/portal/payments', label: 'Payments', icon: ReceiptText },
];

const Table = ({ headings, children }: { headings: string[]; children: ReactNode }) => (
  <div className="overflow-x-auto rounded-lg border bg-white">
    <table className="min-w-[680px] w-full text-sm">
      <thead className="bg-[#f9fafb] text-left text-xs uppercase text-[#6b7280]">
        <tr>
          {headings.map((heading) => (
            <th key={heading} className="p-4">{heading}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

export function PartnerPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const role = user?.role === 'CUSTOMER' || user?.role === 'VENDOR' ? (user.role as PortalRole) : undefined;

  const dashboard = usePortalDashboard(role, user?.id);
  const invoices = usePortalInvoices(role, user?.id);
  const orders = usePortalOrders(role, user?.id);
  const payments = usePortalPayments(role, user?.id);

  const createPayment = useCreateCustomerPayment();

  // State for payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const openPayModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.balance);
    setPaymentMethod('Cash');
    setPaymentReference('');
    setShowPayModal(true);
  };

  const handlePaySubmit = async () => {
    if (!selectedInvoice) return;
    if (paymentAmount <= 0) {
      alert('Amount must be greater than 0.');
      return;
    }
    if (paymentAmount > selectedInvoice.balance) {
      alert('Amount cannot exceed the balance due.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPayment.mutateAsync({
        paymentDate: new Date().toISOString().split('T')[0],
        customerId: selectedInvoice.customerId,
        customerInvoiceId: selectedInvoice.id,
        amount: paymentAmount,
        paymentMethod,
        reference: paymentReference,
        notes: `Payment via portal for invoice ${selectedInvoice.number}`,
      });
      setShowPayModal(false);
      // Refresh invoices list
      invoices.refetch();
      dashboard.refetch();
    } catch (error: any) {
      alert(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!role || !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f8fa] p-6">
        <EmptyState
          icon={<LogIn className="h-12 w-12 text-[#d1d5db]" />}
          title="Portal access required"
          description="Sign in with a customer or vendor account to view only your own documents and payment history."
        />
      </main>
    );
  }

  const mode = location.pathname.split('/')[2] || 'overview';
  const isVendor = role === 'VENDOR';
  const labels = {
    invoices: isVendor ? 'Vendor Bills' : 'Customer Invoices',
    orders: isVendor ? 'Purchase Orders' : 'Sales Orders',
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <h1 className="font-semibold text-[#1a2332]">Urban Furniture Portal</h1>
            <p className="text-xs text-[#6b7280]">Signed in as {user.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#eef2f6] px-3 py-1 text-xs font-medium">
              {isVendor ? 'Vendor' : 'Customer'} Portal
            </span>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-6">
        <nav className="mb-6 flex gap-1 overflow-x-auto border-b">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/portal'}
                className={({ isActive }) =>
                  `flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm ${
                    isActive
                      ? 'border-b-2 border-[#1a2a3a] text-[#1a2332]'
                      : 'text-[#6b7280]'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {mode === 'overview' && (
          <>
            <h2 className="mb-1 text-xl font-semibold">Overview</h2>
            <p className="mb-4 text-sm text-[#6b7280]">Your account activity at a glance.</p>
            {dashboard.isLoading ? (
              <div className="rounded-lg border bg-white p-8 text-sm text-[#6b7280]">
                Loading portal…
              </div>
            ) : dashboard.data && (
              <>
                <div className="mb-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-xs text-[#6b7280]">{isVendor ? 'Open Bills' : 'Open Invoices'}</p>
                    <p className="mt-1 text-lg font-semibold">{dashboard.data.openCount}</p>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-xs text-[#6b7280]">Outstanding Amount</p>
                    <p className="mt-1 text-lg font-semibold">{formatCurrency(dashboard.data.outstandingAmount)}</p>
                  </div>
                </div>
                <h3 className="mb-2 font-medium">Recent {isVendor ? 'Purchase Orders' : 'Orders'}</h3>
                <Table headings={['Number', 'Date', 'Total', 'Status']}>
                  {dashboard.data.recentOrders.map((order) => (
                    <tr key={order.id} className="border-t">
                      <td className="p-4">{order.number}</td>
                      <td className="p-4">{order.date}</td>
                      <td className="p-4">{formatCurrency(order.total)}</td>
                      <td className="p-4">{order.status}</td>
                    </tr>
                  ))}
                </Table>
              </>
            )}
          </>
        )}

        {mode === 'invoices' && (
          <>
            <h2 className="mb-4 text-xl font-semibold">{labels.invoices}</h2>
            {invoices.data?.length ? (
              <Table
                headings={[
                  'Number',
                  'Date',
                  'Due Date',
                  'Total',
                  'Paid',
                  'Balance',
                  'Status',
                  'Action',
                ]}
              >
                {invoices.data.map((invoice) => (
                  <tr key={invoice.id} className="border-t">
                    <td className="p-4">{invoice.number}</td>
                    <td className="p-4">{invoice.date}</td>
                    <td className="p-4">{invoice.dueDate || '—'}</td>
                    <td className="p-4">{formatCurrency(invoice.total)}</td>
                    <td className="p-4">{formatCurrency(invoice.paid)}</td>
                    <td className="p-4">{formatCurrency(invoice.balance)}</td>
                    <td className="p-4">{invoice.status}</td>
                    <td className="p-4">
                      {invoice.balance > 0 && (
                        <Button
                          size="sm"
                          className="bg-[#1a2a3a] hover:bg-[#2a3f56]"
                          onClick={() => openPayModal(invoice)}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Pay
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
            ) : (
              <EmptyState
                icon={<FileText className="h-12 w-12 text-[#d1d5db]" />}
                title={`No ${labels.invoices.toLowerCase()}`}
                description="There are no documents to show."
              />
            )}
          </>
        )}

        {mode === 'orders' && (
          <>
            <h2 className="mb-4 text-xl font-semibold">{labels.orders}</h2>
            {orders.data?.length ? (
              <Table headings={['Number', 'Date', 'Total', 'Status']}>
                {orders.data.map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="p-4">{order.number}</td>
                    <td className="p-4">{order.date}</td>
                    <td className="p-4">{formatCurrency(order.total)}</td>
                    <td className="p-4">{order.status}</td>
                  </tr>
                ))}
              </Table>
            ) : (
              <EmptyState
                icon={<ShoppingCart className="h-12 w-12 text-[#d1d5db]" />}
                title="No orders"
                description="There are no orders to show."
              />
            )}
          </>
        )}

        {mode === 'payments' && (
          <>
            <h2 className="mb-4 text-xl font-semibold">Payment History</h2>
            {payments.data?.length ? (
              <Table headings={['Payment Number', 'Date', 'Method', 'Reference', 'Amount']}>
                {payments.data.map((payment) => (
                  <tr key={payment.id} className="border-t">
                    <td className="p-4">{payment.number}</td>
                    <td className="p-4">{payment.date}</td>
                    <td className="p-4">{payment.method}</td>
                    <td className="p-4">{payment.reference || '—'}</td>
                    <td className="p-4">{formatCurrency(payment.amount)}</td>
                  </tr>
                ))}
              </Table>
            ) : (
              <EmptyState
                icon={<ReceiptText className="h-12 w-12 text-[#d1d5db]" />}
                title="No payments"
                description="There is no payment history to show."
              />
            )}
          </>
        )}
      </div>

      {/* Pay Invoice Modal */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#1a2332]">Pay Invoice</h3>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-[#6b7280] hover:text-[#1a2332]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#6b7280]">Invoice</p>
                <p className="font-medium text-[#1a2332]">{selectedInvoice.number}</p>
              </div>
              <div>
                <p className="text-sm text-[#6b7280]">Balance Due</p>
                <p className="font-bold text-[#1a2332]">{formatCurrency(selectedInvoice.balance)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a2332]">
                  Amount to Pay *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a2332]">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a2332]">
                  Reference (optional)
                </label>
                <input
                  type="text"
                  placeholder="Cheque/UPI/Bank reference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#e5e7eb]">
                <Button
                  variant="outline"
                  onClick={() => setShowPayModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePaySubmit}
                  disabled={isSubmitting}
                  className="bg-[#1a2a3a] hover:bg-[#2a3f56]"
                >
                  {isSubmitting ? 'Processing...' : 'Pay Now'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}