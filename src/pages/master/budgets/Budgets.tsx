import React, { useState, useMemo } from 'react';
import { Plus, Search, X, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { BudgetForm } from '@/components/forms/BudgetForm';
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/hooks/useBudgets';
import { useAnalyticAccounts } from '@/hooks/useAnalyticAccounts';
import type { Budget, BudgetInput } from '@/types/budget';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/format';

const ITEMS_PER_PAGE = 10;

export const Budgets: React.FC = () => {
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState<string>('');
  const [analyticAccountFilter, setAnalyticAccountFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Fetch analytic accounts for filter dropdown
  const { data: analyticAccounts = [] } = useAnalyticAccounts({ type: 'ALL' });

  const filters = useMemo(() => ({
    search: search.trim() || undefined,
    period: periodFilter || undefined,
    analyticAccountId: analyticAccountFilter || undefined,
  }), [search, periodFilter, analyticAccountFilter]);

  const { data: budgets = [], isLoading, error, refetch } = useBudgets(filters);
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();

  // Compute unique periods for filter dropdown
  const uniquePeriods = useMemo(() => {
    const periods = budgets.map(b => b.period);
    return Array.from(new Set(periods)).sort();
  }, [budgets]);

  const totalItems = budgets.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedBudgets = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return budgets.slice(start, start + ITEMS_PER_PAGE);
  }, [budgets, currentPage]);

  const handleAddBudget = () => {
    setSelectedBudget(null);
    setIsCreateModalOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsEditModalOpen(true);
  };

  const handleViewBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsViewModalOpen(true);
  };

  const handleDeleteBudget = (id: string) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          refetch();
        },
      });
    }
  };

  const handleCreateSubmit = (data: BudgetInput) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        refetch();
      },
    });
  };

  const handleUpdateSubmit = (data: BudgetInput) => {
    if (!selectedBudget) return;
    updateMutation.mutate(
      { id: selectedBudget.id, data },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setSelectedBudget(null);
          refetch();
        },
      }
    );
  };

  const clearFilters = () => {
    setSearch('');
    setPeriodFilter('');
    setAnalyticAccountFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters = search.trim() !== '' || periodFilter !== '' || analyticAccountFilter !== '';

  const renderSkeletonRows = () =>
    Array.from({ length: 5 }).map((_, i) => (
      <tr key={i} className="border-b border-[#e5e7eb]">
        <td className="px-4 py-3"><Skeleton className="h-8 w-40" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
        <td className="px-4 py-3"><Skeleton className="h-8 w-24" /></td>
      </tr>
    ));

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm text-[#6b7280]">Unable to load budgets.</p>
        <Button onClick={() => refetch()} className="mt-4 bg-[#1a2a3a] hover:bg-[#2a3f56]">
          Try again
        </Button>
      </div>
    );
  }

  if (!isLoading && budgets.length === 0 && !hasActiveFilters) {
    return (
      <>
        <PageHeader
          title="Budgets"
          description="Manage planned financial amounts by period and analytic account."
          actions={
            <Button onClick={handleAddBudget} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Budget
            </Button>
          }
        />
        <EmptyState
          icon={<DollarSign className="h-12 w-12 text-[#d1d5db]" />}
          title="No budgets yet"
          description="Create your first budget to start planning your financial targets."
          action={
            <Button onClick={handleAddBudget} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Budget
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
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
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
        title="Budgets"
        description="Manage planned financial amounts by period and analytic account."
        actions={
          <Button onClick={handleAddBudget} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Budget
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-[#e5e7eb]">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search budgets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
            />
          </div>

          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          >
            <option value="">All Periods</option>
            {uniquePeriods.map((period) => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>

          <select
            value={analyticAccountFilter}
            onChange={(e) => setAnalyticAccountFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          >
            <option value="">All Accounts</option>
            {analyticAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
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
          Showing {paginatedBudgets.length} of {totalItems}
        </div>
      </div>

      <div className="mt-4 border border-[#e5e7eb] rounded-md overflow-x-auto">
        <table className="min-w-full divide-y divide-[#e5e7eb]">
          <thead className="bg-[#f9fafb]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Budget Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Period</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Responsible</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#6b7280] uppercase tracking-wider">Planned Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Analytic Account</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#6b7280] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#e5e7eb]">
            {isLoading ? (
              renderSkeletonRows()
            ) : paginatedBudgets.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-[#6b7280]">
                  No budgets found
                </td>
              </tr>
            ) : (
              paginatedBudgets.map((budget) => (
                <tr key={budget.id} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1a2332]">{budget.name}</td>
                  <td className="px-4 py-3 text-sm text-[#1a2332]">{budget.period}</td>
                  <td className="px-4 py-3 text-sm text-[#1a2332]">{budget.responsible}</td>
                  <td className="px-4 py-3 text-sm text-right text-[#1a2332] font-medium">
                    {formatCurrency(budget.plannedAmount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#1a2332]">{budget.analyticAccountName || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewBudget(budget)}
                        className="p-1 text-[#6b7280] hover:text-[#1a2a3a] transition-colors"
                        aria-label="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditBudget(budget)}
                        className="p-1 text-[#6b7280] hover:text-[#1a2a3a] transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBudget(budget.id)}
                        className="p-1 text-[#6b7280] hover:text-red-600 transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add Budget">
        <BudgetForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
          isSubmitting={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Budget">
        {selectedBudget && (
          <BudgetForm
            initialData={selectedBudget}
            onSubmit={handleUpdateSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedBudget(null);
            }}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Budget Details">
        {selectedBudget && (
          <div className="space-y-4">
            <div>
              <div className="text-lg font-semibold text-[#1a2332]">{selectedBudget.name}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[#6b7280]">Period</div>
                <div className="text-[#1a2332]">{selectedBudget.period}</div>
              </div>
              <div>
                <div className="text-[#6b7280]">Responsible</div>
                <div className="text-[#1a2332]">{selectedBudget.responsible}</div>
              </div>
              <div>
                <div className="text-[#6b7280]">Planned Amount</div>
                <div className="text-[#1a2332] font-medium">{formatCurrency(selectedBudget.plannedAmount)}</div>
              </div>
              <div>
                <div className="text-[#6b7280]">Analytic Account</div>
                <div className="text-[#1a2332]">{selectedBudget.analyticAccountName || '-'}</div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-[#e5e7eb]">
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditBudget(selectedBudget);
                }}
                className="bg-[#1a2a3a] hover:bg-[#2a3f56]"
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit Budget
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};