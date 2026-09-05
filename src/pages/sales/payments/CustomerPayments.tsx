import React, { useState, useMemo } from 'react';
import { Plus, Search, X, Eye, Pencil, CheckCircle, XCircle, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { CustomerPaymentForm } from '@/components/forms/CustomerPaymentForm';
import { StatusBadge, type Status } from '@/components/common/StatusBadge';
import {
  useCustomerPayments,
  useCreateCustomerPayment,
  useUpdateCustomerPayment,
  usePostCustomerPayment,
  useCancelCustomerPayment,
} from '@/hooks/useCustomerPayments';
import { useContacts } from '@/hooks/useContacts';
import type { CustomerPayment, CustomerPaymentInput, CustomerPaymentStatus, PaymentMethod } from '@/types/customerPayment';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/format';

const ITEMS_PER_PAGE = 10;

export const CustomerPayments: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CustomerPaymentStatus>('ALL');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<CustomerPayment | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { data: contacts = [] } = useContacts({ type: 'ALL' });
  const customers = contacts.filter(c => c.type === 'CUSTOMER' || c.type === 'BOTH');

  const filters = useMemo(() => ({
    search: search.trim() || undefined,
    status: statusFilter,
    customerId: customerFilter || undefined,
    paymentMethod: methodFilter,
  }), [search, statusFilter, customerFilter, methodFilter]);

  const { data: payments = [], isLoading, error, refetch } = useCustomerPayments(filters);
  const createMutation = useCreateCustomerPayment();
  const updateMutation = useUpdateCustomerPayment();
  const postMutation = usePostCustomerPayment();
  const cancelMutation = useCancelCustomerPayment();

  const totalItems = payments.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return payments.slice(start, start + ITEMS_PER_PAGE);
  }, [payments, currentPage]);

  const handleAddPayment = () => {
    setSelectedPayment(null);
    setIsCreateModalOpen(true);
  };

  const handleEditPayment = (payment: CustomerPayment) => {
    if (payment.status !== 'Draft') {
      // Toast or alert
      return;
    }
    setSelectedPayment(payment);
    setIsEditModalOpen(true);
  };

  const handleViewPayment = (payment: CustomerPayment) => {
    setSelectedPayment(payment);
    setIsViewModalOpen(true);
  };

  const handlePostPayment = (id: string) => {
    if (window.confirm('Are you sure you want to post this payment?')) {
      postMutation.mutate(id, { onSuccess: () => refetch() });
    }
  };

  const handleCancelPayment = (id: string) => {
    if (window.confirm('Are you sure you want to cancel this payment?')) {
      cancelMutation.mutate(id, { onSuccess: () => refetch() });
    }
  };

  const handleCreateSubmit = (data: CustomerPaymentInput) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        refetch();
      },
    });
  };

  const handleUpdateSubmit = (data: CustomerPaymentInput) => {
    if (!selectedPayment) return;
    updateMutation.mutate(
      { id: selectedPayment.id, data },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setSelectedPayment(null);
          refetch();
        },
      }
    );
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setCustomerFilter('');
    setMethodFilter('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'ALL' || customerFilter !== '' || methodFilter !== 'ALL';

  const renderSkeletonRows = () =>
    Array.from({ length: 5 }).map((_, i) => (
      <tr key={i} className="border-b border-[#e5e7eb]">
        <td className="px-4 py-3"><Skeleton className="h-8 w-24" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
        <td className="px-4 py-3"><Skeleton className="h-8 w-24" /></td>
      </tr>
    ));

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm text-[#6b7280]">Unable to load payments.</p>
        <Button onClick={() => refetch()} className="mt-4 bg-[#1a2a3a] hover:bg-[#2a3f56]">
          Try again
        </Button>
      </div>
    );
  }

  if (!isLoading && payments.length === 0 && !hasActiveFilters) {
    return (
      <>
        <PageHeader
          title="Customer Payments"
          description="Record and manage payments received from customers."
          actions={
            <Button onClick={handleAddPayment} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
              <Plus className="h-4 w-4 mr-1.5" />
              Record Payment
            </Button>
          }
        />
        <EmptyState
          icon={<CreditCard className="h-12 w-12 text-[#d1d5db]" />}
          title="No customer payments yet"
          description="Record your first customer payment against an outstanding invoice."
          action={
            <Button onClick={handleAddPayment} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
              <Plus className="h-4 w-4 mr-1.5" />
              Record Payment
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Customer Payments"
        description="Record and manage payments received from customers."
        actions={
          <Button onClick={handleAddPayment} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
            <Plus className="h-4 w-4 mr-1.5" />
            Record Payment
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-[#e5e7eb]">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search payments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          >
            <option value="ALL">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Posted">Posted</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as typeof methodFilter)}
            className="px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          >
            <option value="ALL">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="Bank">Bank</option>
            <option value="UPI">UPI</option>
            <option value="Cheque">Cheque</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          >
            <option value="">All Customers</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[#6b7280]">
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
        <div className="text-sm text-[#6b7280]">
          Showing {paginatedPayments.length} of {totalItems}
        </div>
      </div>

      <div className="mt-4 border border-[#e5e7eb] rounded-md overflow-x-auto">
        <table className="min-w-full divide-y divide-[#e5e7eb]">
          <thead className="bg-[#f9fafb]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Payment #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Invoice</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#6b7280] uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Method</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#6b7280] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#e5e7eb]">
            {isLoading ? (
              renderSkeletonRows()
            ) : paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-[#6b7280]">
                  No payments found
                </td>
              </tr>
            ) : (
              paginatedPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1a2332]">{payment.paymentNumber}</td>
                  <td className="px-4 py-3 text-sm text-[#1a2332]">{new Date(payment.paymentDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-sm text-[#1a2332]">{payment.customerName || '-'}</td>
                  <td className="px-4 py-3 text-sm text-[#1a2332]">{payment.invoiceNumber || '-'}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-[#1a2332]">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#1a2332]">{payment.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={payment.status.toLowerCase() as Status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewPayment(payment)}
                        className="p-1 text-[#6b7280] hover:text-[#1a2a3a] transition-colors"
                        aria-label="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {payment.status === 'Draft' && (
                        <>
                          <button
                            onClick={() => handleEditPayment(payment)}
                            className="p-1 text-[#6b7280] hover:text-[#1a2a3a] transition-colors"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePostPayment(payment.id)}
                            className="p-1 text-green-600 hover:text-green-800 transition-colors"
                            aria-label="Post"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {(payment.status === 'Draft' || payment.status === 'Posted') && (
                        <button
                          onClick={() => handleCancelPayment(payment.id)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          aria-label="Cancel"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between py-3">
          <div className="text-sm text-[#6b7280]">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-[#e5e7eb] rounded-md text-sm disabled:opacity-50 hover:bg-[#f9fafb] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 border border-[#e5e7eb] rounded-md text-sm transition-colors ${
                    page === currentPage ? 'bg-[#1a2a3a] text-white border-[#1a2a3a]' : 'hover:bg-[#f9fafb]'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            {totalPages > 5 && <span className="px-3 py-1">…</span>}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-[#e5e7eb] rounded-md text-sm disabled:opacity-50 hover:bg-[#f9fafb] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Record Payment">
        <CustomerPaymentForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
          isSubmitting={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Payment">
        {selectedPayment && (
          <CustomerPaymentForm
            initialData={selectedPayment}
            onSubmit={handleUpdateSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedPayment(null);
            }}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Payment Details">
        {selectedPayment && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-lg font-semibold text-[#1a2332]">{selectedPayment.paymentNumber}</div>
                <div className="text-sm text-[#6b7280]">Date: {new Date(selectedPayment.paymentDate).toLocaleDateString('en-IN')}</div>
              </div>
              <StatusBadge status={selectedPayment.status.toLowerCase() as Status} />
            </div>

            <div>
              <div className="text-sm font-medium text-[#1a2332]">Customer</div>
              <div className="text-sm text-[#1a2332]">{selectedPayment.customerName || '-'}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-[#1a2332]">Invoice</div>
              <div className="text-sm text-[#1a2332]">{selectedPayment.invoiceNumber || '-'}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[#6b7280]">Amount</div>
                <div className="text-[#1a2332] font-medium">{formatCurrency(selectedPayment.amount)}</div>
              </div>
              <div>
                <div className="text-[#6b7280]">Payment Method</div>
                <div className="text-[#1a2332]">{selectedPayment.paymentMethod}</div>
              </div>
            </div>

            {selectedPayment.reference && (
              <div>
                <div className="text-sm font-medium text-[#1a2332]">Reference</div>
                <div className="text-sm text-[#1a2332]">{selectedPayment.reference}</div>
              </div>
            )}

            {selectedPayment.notes && (
              <div>
                <div className="text-sm font-medium text-[#1a2332]">Notes</div>
                <div className="text-sm text-[#6b7280]">{selectedPayment.notes}</div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-[#e5e7eb]">
              {selectedPayment.status === 'Draft' && (
                <Button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleEditPayment(selectedPayment);
                  }}
                  className="bg-[#1a2a3a] hover:bg-[#2a3f56]"
                >
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Edit Payment
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
