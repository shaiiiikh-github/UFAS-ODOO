import React, { useState, useMemo } from 'react';
import { Plus, Search, X, Eye, Pencil, ChevronLeft, ChevronRight, PieChart } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { AnalyticAccountTypeBadge } from '@/components/common/AnalyticAccountTypeBadge';
import { AnalyticAccountForm } from '@/components/forms/AnalyticAccountForm';
import { useAnalyticAccounts, useCreateAnalyticAccount, useUpdateAnalyticAccount } from '@/hooks/useAnalyticAccounts';
import type { AnalyticAccount, AnalyticAccountInput, AnalyticAccountType } from '@/types/analyticAccount';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

const ITEMS_PER_PAGE = 10;

export const AnalyticAccounts: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | AnalyticAccountType>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAccount, setSelectedAccount] = useState<AnalyticAccount | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const filters = useMemo(() => ({
    search: search.trim() || undefined,
    type: typeFilter === 'ALL' ? undefined : typeFilter,
  }), [search, typeFilter]);

  const { data: accounts = [], isLoading, error, refetch } = useAnalyticAccounts(filters);
  const createMutation = useCreateAnalyticAccount();
  const updateMutation = useUpdateAnalyticAccount();

  const totalItems = accounts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return accounts.slice(start, start + ITEMS_PER_PAGE);
  }, [accounts, currentPage]);

  const handleAddAccount = () => {
    setSelectedAccount(null);
    setIsCreateModalOpen(true);
  };

  const handleEditAccount = (account: AnalyticAccount) => {
    setSelectedAccount(account);
    setIsEditModalOpen(true);
  };

  const handleViewAccount = (account: AnalyticAccount) => {
    setSelectedAccount(account);
    setIsViewModalOpen(true);
  };

  const handleCreateSubmit = (data: AnalyticAccountInput) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        refetch();
      },
    });
  };

  const handleUpdateSubmit = (data: AnalyticAccountInput) => {
    if (!selectedAccount) return;
    updateMutation.mutate(
      { id: selectedAccount.id, data },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setSelectedAccount(null);
          refetch();
        },
      }
    );
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters = search.trim() !== '' || typeFilter !== 'ALL';

  const renderSkeletonRows = () =>
    Array.from({ length: 5 }).map((_, i) => (
      <tr key={i} className="border-b border-[#e5e7eb]">
        <td className="px-4 py-3"><Skeleton className="h-8 w-48" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
        <td className="px-4 py-3"><Skeleton className="h-8 w-16" /></td>
      </tr>
    ));

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm text-[#6b7280]">Unable to load analytic accounts.</p>
        <Button onClick={() => refetch()} className="mt-4 bg-[#1a2a3a] hover:bg-[#2a3f56]">
          Try again
        </Button>
      </div>
    );
  }

  if (!isLoading && accounts.length === 0 && !hasActiveFilters) {
    return (
      <>
        <PageHeader
          title="Analytic Accounts"
          description="Manage analytic accounts used for income, expense tracking, and budgeting."
          actions={
            <Button onClick={handleAddAccount} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Analytic Account
            </Button>
          }
        />
        <EmptyState
          icon={<PieChart className="h-12 w-12 text-[#d1d5db]" />}
          title="No analytic accounts yet"
          description="Add your first analytic account to start tracking income and expense categories for budgeting."
          action={
            <Button onClick={handleAddAccount} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Analytic Account
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
        title="Analytic Accounts"
        description="Manage analytic accounts used for income, expense tracking, and budgeting."
        actions={
          <Button onClick={handleAddAccount} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Analytic Account
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-[#e5e7eb]">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search analytic accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="px-3 py-2 bg-white border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2a3a]"
          >
            <option value="ALL">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[#6b7280]">
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
        <div className="text-sm text-[#6b7280]">
          Showing {paginatedAccounts.length} of {totalItems}
        </div>
      </div>

      <div className="mt-4 border border-[#e5e7eb] rounded-md overflow-x-auto">
        <table className="min-w-full divide-y divide-[#e5e7eb]">
          <thead className="bg-[#f9fafb]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Analytic Account</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#6b7280] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#e5e7eb]">
            {isLoading ? (
              renderSkeletonRows()
            ) : paginatedAccounts.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-[#6b7280]">
                  No analytic accounts found
                </td>
              </tr>
            ) : (
              paginatedAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1a2332]">{account.name}</td>
                  <td className="px-4 py-3">
                    <AnalyticAccountTypeBadge type={account.type} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewAccount(account)}
                        className="p-1 text-[#6b7280] hover:text-[#1a2a3a] transition-colors"
                        aria-label="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditAccount(account)}
                        className="p-1 text-[#6b7280] hover:text-[#1a2a3a] transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
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
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add Analytic Account">
        <AnalyticAccountForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
          isSubmitting={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Analytic Account">
        {selectedAccount && (
          <AnalyticAccountForm
            initialData={selectedAccount}
            onSubmit={handleUpdateSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedAccount(null);
            }}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Analytic Account Details">
        {selectedAccount && (
          <div className="space-y-4">
            <div>
              <div className="text-lg font-semibold text-[#1a2332]">{selectedAccount.name}</div>
              <AnalyticAccountTypeBadge type={selectedAccount.type} />
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <div className="text-[#6b7280]">Type</div>
                <div className="text-[#1a2332] capitalize">{selectedAccount.type}</div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-[#e5e7eb]">
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditAccount(selectedAccount);
                }}
                className="bg-[#1a2a3a] hover:bg-[#2a3f56]"
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit Analytic Account
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};