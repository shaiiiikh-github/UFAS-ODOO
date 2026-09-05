import React, { useState, useMemo } from 'react';
import { Plus, Search, X, Eye, Pencil, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { JournalTypeBadge } from '@/components/common/JournalTypeBadge';
import { JournalForm } from '@/components/forms/JournalForm';
import { useJournals, useCreateJournal, useUpdateJournal } from '@/hooks/useJournals';
import type { Journal, JournalInput, JournalType } from '@/types/journal';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

const ITEMS_PER_PAGE = 10;

export const Journals: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | JournalType>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const filters = useMemo(() => ({
    search: search.trim() || undefined,
    type: typeFilter === 'ALL' ? undefined : typeFilter,
  }), [search, typeFilter]);

  const { data: journals = [], isLoading, error, refetch } = useJournals(filters);
  const createMutation = useCreateJournal();
  const updateMutation = useUpdateJournal();

  const totalItems = journals.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedJournals = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return journals.slice(start, start + ITEMS_PER_PAGE);
  }, [journals, currentPage]);

  const handleAddJournal = () => {
    setSelectedJournal(null);
    setIsCreateModalOpen(true);
  };

  const handleEditJournal = (journal: Journal) => {
    setSelectedJournal(journal);
    setIsEditModalOpen(true);
  };

  const handleViewJournal = (journal: Journal) => {
    setSelectedJournal(journal);
    setIsViewModalOpen(true);
  };

  const handleCreateSubmit = (data: JournalInput) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        refetch();
      },
    });
  };

  const handleUpdateSubmit = (data: JournalInput) => {
    if (!selectedJournal) return;
    updateMutation.mutate(
      { id: selectedJournal.id, data },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setSelectedJournal(null);
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
        <p className="text-sm text-[#6b7280]">Unable to load journals.</p>
        <Button onClick={() => refetch()} className="mt-4 bg-[#1a2a3a] hover:bg-[#2a3f56]">
          Try again
        </Button>
      </div>
    );
  }

  if (!isLoading && journals.length === 0 && !hasActiveFilters) {
    return (
      <>
        <PageHeader
          title="Journals"
          description="Manage journal types used for accounting transactions."
          actions={
            <Button onClick={handleAddJournal} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Journal
            </Button>
          }
        />
        <EmptyState
          icon={<BookOpen className="h-12 w-12 text-[#d1d5db]" />}
          title="No journals yet"
          description="Add your first journal type to start configuring your accounting system."
          action={
            <Button onClick={handleAddJournal} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Journal
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
        title="Journals"
        description="Manage journal types used for accounting transactions."
        actions={
          <Button onClick={handleAddJournal} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Journal
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-[#e5e7eb]">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search journals..."
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
            <option value="sales">Sales</option>
            <option value="purchase">Purchase</option>
            <option value="bank">Bank</option>
            <option value="cash">Cash</option>
          </select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[#6b7280]">
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
        <div className="text-sm text-[#6b7280]">
          Showing {paginatedJournals.length} of {totalItems}
        </div>
      </div>

      <div className="mt-4 border border-[#e5e7eb] rounded-md overflow-x-auto">
        <table className="min-w-full divide-y divide-[#e5e7eb]">
          <thead className="bg-[#f9fafb]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Journal Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#6b7280] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#e5e7eb]">
            {isLoading ? (
              renderSkeletonRows()
            ) : paginatedJournals.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-[#6b7280]">
                  No journals found
                </td>
              </tr>
            ) : (
              paginatedJournals.map((journal) => (
                <tr key={journal.id} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1a2332]">{journal.name}</td>
                  <td className="px-4 py-3">
                    <JournalTypeBadge type={journal.type} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewJournal(journal)}
                        className="p-1 text-[#6b7280] hover:text-[#1a2a3a] transition-colors"
                        aria-label="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditJournal(journal)}
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
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add Journal">
        <JournalForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
          isSubmitting={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Journal">
        {selectedJournal && (
          <JournalForm
            initialData={selectedJournal}
            onSubmit={handleUpdateSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedJournal(null);
            }}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Journal Details">
        {selectedJournal && (
          <div className="space-y-4">
            <div>
              <div className="text-lg font-semibold text-[#1a2332]">{selectedJournal.name}</div>
              <JournalTypeBadge type={selectedJournal.type} />
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <div className="text-[#6b7280]">Type</div>
                <div className="text-[#1a2332] capitalize">{selectedJournal.type}</div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-[#e5e7eb]">
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditJournal(selectedJournal);
                }}
                className="bg-[#1a2a3a] hover:bg-[#2a3f56]"
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit Journal
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};