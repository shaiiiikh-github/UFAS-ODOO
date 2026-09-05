import React, { useState, useMemo } from 'react';
import { Plus, Search, X, Eye, Pencil, CheckCircle, XCircle, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { CustomerInvoiceForm } from '@/components/forms/CustomerInvoiceForm';
import { StatusBadge, type Status } from '@/components/common/StatusBadge';
import { useCustomerInvoices, useCreateCustomerInvoice, useUpdateCustomerInvoice, usePostCustomerInvoice, useCancelCustomerInvoice } from '@/hooks/useCustomerInvoices';
import { useContacts } from '@/hooks/useContacts';
import type { CustomerInvoice, CustomerInvoiceInput, CustomerInvoiceStatus } from '@/types/customerInvoice';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/format';

const ITEMS_PER_PAGE = 10;

export const CustomerInvoices: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CustomerInvoiceStatus>('ALL');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerInvoice | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { data: contacts = [] } = useContacts({ type: 'ALL' });
  const customers = contacts.filter(c => c.type === 'CUSTOMER' || c.type === 'BOTH');

  const filters = useMemo(() => ({
    search: search.trim() || undefined,
    status: statusFilter,
    customerId: customerFilter || undefined,
  }), [search, statusFilter, customerFilter]);

  const { data: invoices = [], isLoading, error, refetch } = useCustomerInvoices(filters);
  const createMutation = useCreateCustomerInvoice();
  const updateMutation = useUpdateCustomerInvoice();
  const postMutation = usePostCustomerInvoice();
  const cancelMutation = useCancelCustomerInvoice();

  const totalItems = invoices.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return invoices.slice(start, start + ITEMS_PER_PAGE);
  }, [invoices, currentPage]);

  const handleAddInvoice = () => {
    setSelectedInvoice(null);
    setIsCreateModalOpen(true);
  };

  const handleEditInvoice = (invoice: CustomerInvoice) => {
    if (invoice.status !== 'Draft') {
      // Toast or alert
      return;
    }
    setSelectedInvoice(invoice);
    setIsEditModalOpen(true);
  };

  const handleViewInvoice = (invoice: CustomerInvoice) => {
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const handlePostInvoice = (id: string) => {
    if (window.confirm('Are you sure you want to post this invoice?')) {
      postMutation.mutate(id, { onSuccess: () => refetch() });
    }
  };

  const handleCancelInvoice = (id: string) => {
    if (window.confirm('Are you sure you want to cancel this invoice?')) {
      cancelMutation.mutate(id, { onSuccess: () => refetch() });
    }
  };

  const handleCreateSubmit = (data: CustomerInvoiceInput) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        refetch();
      },
    });
  };

  const handleUpdateSubmit = (data: CustomerInvoiceInput) => {
    if (!selectedInvoice) return;
    updateMutation.mutate(
      { id: selectedInvoice.id, data },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setSelectedInvoice(null);
          refetch();
        },
      }
    );
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setCustomerFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'ALL' || customerFilter !== '';

  const renderSkeletonRows = () =>
    Array.from({ length: 5 }).map((_, i) => (
      <tr key={i} className="border-b border-[#e5e7eb]">
        <td className="px-4 py-3"><Skeleton className="h-8 w-24" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
        <td className="px-4 py-3"><Skeleton className="h-8 w-24" /></td>
      </tr>
    ));

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm text-[#6b7280]">Unable to load invoices.</p>
        <Button onClick={() => refetch()} className="mt-4 bg-[#1a2a3a] hover:bg-[#2a3f56]">
          Try again
        </Button>
      </div>
    );
  }

  if (!isLoading && invoices.length === 0 && !hasActiveFilters) {
    return (
      <>
        <PageHeader
          title="Customer Invoices"
          description="Create and manage invoices for customer sales."
          actions={
            <Button onClick={handleAddInvoice} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Invoice
            </Button>
          }
        />
        <EmptyState
          icon={<FileText className="h-12 w-12 text-[#d1d5db]" />}
          title="No customer invoices yet"
          description="Create your first invoice from a sales order or manually."
          action={
            <Button onClick={handleAddInvoice} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Invoice
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Customer Invoices"
        description="Create and manage invoices for customer sales."
        actions={
          <Button onClick={handleAddInvoice} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
            <Plus className="h-4 w-4 mr-1.5" />
            Create Invoice
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-[#e5e7eb]">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search invoices..."
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
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
            <option value="Cancelled">Cancelled</option>
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
          Showing {paginatedInvoices.length} of {totalItems}
        </div>
      </div>

      <div className="mt-4 border border-[#e5e7eb] rounded-md overflow-x-auto">
        <table className="min-w-full divide-y divide-[#e5e7eb]">
          <thead className="bg-[#f9fafb]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Invoice #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Sales Order</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#6b7280] uppercase tracking-wider">Total</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#6b7280] uppercase tracking-wider">Balance Due</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#6b7280] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#e5e7eb]">
            {isLoading ? (
              renderSkeletonRows()
            ) : paginatedInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-[#6b7280]">
                  No invoices found
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1a2332]">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm text-[#1a2332]">{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-sm text-[#1a2332]">{inv.customerName || '-'}</td>
                  <td className="px-4 py-3 text-sm text-[#1a2332]">{inv.salesOrderNumber || '-'}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-[#1a2332]">
                    {formatCurrency(inv.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-[#1a2332]">
                    {formatCurrency(inv.balanceDue)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status.toLowerCase() as Status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewInvoice(inv)}
                        className="p-1 text-[#6b7280] hover:text-[#1a2a3a] transition-colors"
                        aria-label="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {inv.status === 'Draft' && (
                        <>
                          <button
                            onClick={() => handleEditInvoice(inv)}
                            className="p-1 text-[#6b7280] hover:text-[#1a2a3a] transition-colors"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePostInvoice(inv.id)}
                            className="p-1 text-green-600 hover:text-green-800 transition-colors"
                            aria-label="Post"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {(inv.status === 'Draft' || inv.status === 'Posted') && (
                        <button
                          onClick={() => handleCancelInvoice(inv.id)}
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
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Customer Invoice" size="wide">
        <CustomerInvoiceForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
          isSubmitting={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Customer Invoice" size="wide">
        {selectedInvoice && (
          <CustomerInvoiceForm
            initialData={selectedInvoice}
            onSubmit={handleUpdateSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedInvoice(null);
            }}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Invoice Details" size="wide">
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-lg font-semibold text-[#1a2332]">{selectedInvoice.invoiceNumber}</div>
                <div className="text-sm text-[#6b7280]">Date: {new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-IN')}</div>
                {selectedInvoice.dueDate && (
                  <div className="text-sm text-[#6b7280]">Due: {new Date(selectedInvoice.dueDate).toLocaleDateString('en-IN')}</div>
                )}
                {selectedInvoice.salesOrderNumber && (
                  <div className="text-sm text-[#6b7280]">Sales Order: {selectedInvoice.salesOrderNumber}</div>
                )}
              </div>
              <StatusBadge status={selectedInvoice.status.toLowerCase() as Status} />
            </div>

            <div>
              <div className="text-sm font-medium text-[#1a2332]">Customer</div>
              <div className="text-sm text-[#1a2332]">{selectedInvoice.customerName || '-'}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-[#1a2332]">Items</div>
              <div className="border border-[#e5e7eb] rounded-md overflow-x-auto mt-1">
                <table className="min-w-full divide-y divide-[#e5e7eb]">
                  <thead className="bg-[#f9fafb]">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-[#6b7280]">Product</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-[#6b7280]">Qty</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-[#6b7280]">Unit Price</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-[#6b7280]">Tax</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-[#6b7280]">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {selectedInvoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-sm text-[#1a2332]">{item.productName}</td>
                        <td className="px-3 py-2 text-sm text-right text-[#1a2332]">{item.quantity}</td>
                        <td className="px-3 py-2 text-sm text-right text-[#1a2332]">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-3 py-2 text-sm text-right text-[#1a2332]">{(item.taxRate * 100).toFixed(0)}%</td>
                        <td className="px-3 py-2 text-sm text-right font-medium text-[#1a2332]">{formatCurrency(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#f9fafb]">
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right font-medium text-[#1a2332]">Subtotal</td>
                      <td className="px-3 py-2 text-right font-medium text-[#1a2332]">{formatCurrency(selectedInvoice.subtotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right font-medium text-[#1a2332]">Tax</td>
                      <td className="px-3 py-2 text-right font-medium text-[#1a2332]">{formatCurrency(selectedInvoice.taxAmount)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right font-bold text-[#1a2332]">Total</td>
                      <td className="px-3 py-2 text-right font-bold text-[#1a2332]">{formatCurrency(selectedInvoice.totalAmount)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right font-medium text-[#1a2332]">Paid Amount</td>
                      <td className="px-3 py-2 text-right font-medium text-[#1a2332]">{formatCurrency(selectedInvoice.paidAmount)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right font-bold text-[#1a2332]">Balance Due</td>
                      <td className="px-3 py-2 text-right font-bold text-[#1a2332]">{formatCurrency(selectedInvoice.balanceDue)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {selectedInvoice.notes && (
              <div>
                <div className="text-sm font-medium text-[#1a2332]">Notes</div>
                <div className="text-sm text-[#6b7280]">{selectedInvoice.notes}</div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-[#e5e7eb]">
              {selectedInvoice.status === 'Draft' && (
                <Button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleEditInvoice(selectedInvoice);
                  }}
                  className="bg-[#1a2a3a] hover:bg-[#2a3f56]"
                >
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Edit Invoice
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
