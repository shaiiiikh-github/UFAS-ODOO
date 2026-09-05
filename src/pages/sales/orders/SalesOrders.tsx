import React, { useState, useMemo } from 'react';
import { Plus, Search, X, Eye, Pencil, CheckCircle, XCircle, Trash2, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { SalesOrderForm } from '@/components/forms/SalesOrderForm';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useSalesOrders, useCreateSalesOrder, useUpdateSalesOrder, useConfirmSalesOrder, useCancelSalesOrder, useDeleteSalesOrder } from '@/hooks/useSalesOrders';
import { useContacts } from '@/hooks/useContacts';
import type { SalesOrder, SalesOrderInput, SalesOrderStatus } from '@/types/salesOrder';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/format';

const ITEMS_PER_PAGE = 10;

export const SalesOrders: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SalesOrderStatus>('ALL');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Fetch customers for filter dropdown
  const { data: contacts = [] } = useContacts({ type: 'ALL' });
  const customers = contacts.filter(c => c.type === 'CUSTOMER' || c.type === 'BOTH');

  const filters = useMemo(() => ({
    search: search.trim() || undefined,
    status: statusFilter,
    customerId: customerFilter || undefined,
  }), [search, statusFilter, customerFilter]);

  const { data: orders = [], isLoading, error, refetch } = useSalesOrders(filters);
  const createMutation = useCreateSalesOrder();
  const updateMutation = useUpdateSalesOrder();
  const confirmMutation = useConfirmSalesOrder();
  const cancelMutation = useCancelSalesOrder();
  const deleteMutation = useDeleteSalesOrder();

  const totalItems = orders.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return orders.slice(start, start + ITEMS_PER_PAGE);
  }, [orders, currentPage]);

  const handleAddOrder = () => {
    setSelectedOrder(null);
    setIsCreateModalOpen(true);
  };

  const handleEditOrder = (order: SalesOrder) => {
    if (order.status !== 'Draft') {
      // Show a toast or alert that only Draft can be edited
      return;
    }
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const handleViewOrder = (order: SalesOrder) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleConfirmOrder = (id: string) => {
    if (window.confirm('Are you sure you want to confirm this sales order?')) {
      confirmMutation.mutate(id, {
        onSuccess: () => refetch(),
      });
    }
  };

  const handleCancelOrder = (id: string) => {
    if (window.confirm('Are you sure you want to cancel this sales order?')) {
      cancelMutation.mutate(id, {
        onSuccess: () => refetch(),
      });
    }
  };

  const handleDeleteOrder = (id: string) => {
    if (window.confirm('Are you sure you want to delete this sales order? This action cannot be undone.')) {
      deleteMutation.mutate(id, {
        onSuccess: () => refetch(),
      });
    }
  };

  const handleCreateSubmit = (data: SalesOrderInput) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        refetch();
      },
    });
  };

  const handleUpdateSubmit = (data: SalesOrderInput) => {
    if (!selectedOrder) return;
    updateMutation.mutate(
      { id: selectedOrder.id, data },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setSelectedOrder(null);
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
        <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
        <td className="px-4 py-3"><Skeleton className="h-8 w-24" /></td>
      </tr>
    ));

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm text-[#6b7280]">Unable to load sales orders.</p>
        <Button onClick={() => refetch()} className="mt-4 bg-[#1a2a3a] hover:bg-[#2a3f56]">
          Try again
        </Button>
      </div>
    );
  }

  if (!isLoading && orders.length === 0 && !hasActiveFilters) {
    return (
      <>
        <PageHeader
          title="Sales Orders"
          description="Create and manage customer sales orders."
          actions={
            <Button onClick={handleAddOrder} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Sales Order
            </Button>
          }
        />
        <EmptyState
          icon={<ShoppingCart className="h-12 w-12 text-[#d1d5db]" />}
          title="No sales orders yet"
          description="Create your first sales order to start managing customer purchases."
          action={
            <Button onClick={handleAddOrder} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Sales Order
            </Button>
          }
        />
      </>
    );
  }

  const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({
    isOpen,
    onClose,
    title,
    children,
  }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[#1a2332]">{title}</h2>
            <button onClick={onClose} className="text-[#6b7280] hover:text-[#1a2332]">
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="Sales Orders"
        description="Create and manage customer sales orders."
        actions={
          <Button onClick={handleAddOrder} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
            <Plus className="h-4 w-4 mr-1.5" />
            Create Sales Order
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-[#e5e7eb]">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search orders..."
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
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          >
            <option value="">All Customers</option>
            {customers.map((c) => (
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
          Showing {paginatedOrders.length} of {totalItems}
        </div>
      </div>

      <div className="mt-4 border border-[#e5e7eb] rounded-md overflow-x-auto">
        <table className="min-w-full divide-y divide-[#e5e7eb]">
          <thead className="bg-[#f9fafb]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Order #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Customer</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#6b7280] uppercase tracking-wider">Items</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#6b7280] uppercase tracking-wider">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#6b7280] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#e5e7eb]">
            {isLoading ? (
              renderSkeletonRows()
            ) : paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-[#6b7280]">
                  No sales orders found
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1a2332]">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-sm text-[#1a2332]">{new Date(order.orderDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-sm text-[#1a2332]">{order.customerName || '-'}</td>
                  <td className="px-4 py-3 text-sm text-center text-[#1a2332]">{order.items.length}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-[#1a2332]">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status.toLowerCase() as any} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="p-1 text-[#6b7280] hover:text-[#1a2a3a] transition-colors"
                        aria-label="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {order.status === 'Draft' && (
                        <>
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="p-1 text-[#6b7280] hover:text-[#1a2a3a] transition-colors"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleConfirmOrder(order.id)}
                            className="p-1 text-green-600 hover:text-green-800 transition-colors"
                            aria-label="Confirm"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-1 text-[#6b7280] hover:text-red-600 transition-colors"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {(order.status === 'Draft' || order.status === 'Confirmed') && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
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
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Sales Order">
        <SalesOrderForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
          isSubmitting={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Sales Order">
        {selectedOrder && (
          <SalesOrderForm
            initialData={selectedOrder}
            onSubmit={handleUpdateSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedOrder(null);
            }}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Sales Order Details">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-lg font-semibold text-[#1a2332]">{selectedOrder.orderNumber}</div>
                <div className="text-sm text-[#6b7280]">Date: {new Date(selectedOrder.orderDate).toLocaleDateString('en-IN')}</div>
              </div>
              <StatusBadge status={selectedOrder.status.toLowerCase() as any} />
            </div>

            <div>
              <div className="text-sm font-medium text-[#1a2332]">Customer</div>
              <div className="text-sm text-[#1a2332]">{selectedOrder.customerName || '-'}</div>
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
                    {selectedOrder.items.map((item) => (
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
                      <td className="px-3 py-2 text-right font-medium text-[#1a2332]">{formatCurrency(selectedOrder.subtotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right font-medium text-[#1a2332]">Tax</td>
                      <td className="px-3 py-2 text-right font-medium text-[#1a2332]">{formatCurrency(selectedOrder.taxAmount)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right font-bold text-[#1a2332]">Total</td>
                      <td className="px-3 py-2 text-right font-bold text-[#1a2332]">{formatCurrency(selectedOrder.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {selectedOrder.notes && (
              <div>
                <div className="text-sm font-medium text-[#1a2332]">Notes</div>
                <div className="text-sm text-[#6b7280]">{selectedOrder.notes}</div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-[#e5e7eb]">
              {selectedOrder.status === 'Draft' && (
                <Button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleEditOrder(selectedOrder);
                  }}
                  className="bg-[#1a2a3a] hover:bg-[#2a3f56]"
                >
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Edit Order
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};