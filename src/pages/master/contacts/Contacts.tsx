import React, { useState, useMemo } from 'react';
import { Plus, Search, X, Eye, Pencil, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { ContactAvatar } from '@/components/common/ContactAvatar';
import { ContactTypeBadge } from '@/components/common/ContactTypeBadge';
import { ContactForm } from '@/components/forms/ContactForm';
import { useContacts, useCreateContact, useUpdateContact } from '@/hooks/useContacts';
import type { Contact, ContactInput, ContactType } from '@/types/contact';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

const ITEMS_PER_PAGE = 10;

export const Contacts: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | ContactType>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);


  const filters = useMemo(() => ({
    search: search.trim() || undefined,
    type: typeFilter === 'ALL' ? undefined : typeFilter,
  }), [search, typeFilter]);

  const { data: contacts = [], isLoading, error, refetch } = useContacts(filters);
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();

  // Pagination
  const totalItems = contacts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return contacts.slice(start, start + ITEMS_PER_PAGE);
  }, [contacts, currentPage]);

  // Handlers
  const handleAddContact = () => {
    setSelectedContact(null);
    setIsCreateModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsEditModalOpen(true);
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsViewModalOpen(true);
  };

  const handleCreateSubmit = (data: ContactInput) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        refetch();
      },
    });
  };

  const handleUpdateSubmit = (data: ContactInput) => {
    if (!selectedContact) return;
    updateMutation.mutate(
      { id: selectedContact.id, data },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setSelectedContact(null);
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

  // Loading skeleton rows
  const renderSkeletonRows = () => (
    Array.from({ length: 5 }).map((_, i) => (
      <tr key={i} className="border-b border-[#e5e7eb]">
        <td className="px-4 py-3"><Skeleton className="h-8 w-48" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
        <td className="px-4 py-3"><Skeleton className="h-8 w-16" /></td>
      </tr>
    ))
  );

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm text-[#6b7280]">Unable to load contacts.</p>
        <Button onClick={() => refetch()} className="mt-4 bg-[#1a2a3a] hover:bg-[#2a3f56]">
          Try again
        </Button>
      </div>
    );
  }

  // Empty state
  if (!isLoading && contacts.length === 0 && !hasActiveFilters) {
    return (
      <>
        <PageHeader
          title="Contacts"
          description="Manage customers and vendors used across sales and purchase transactions."
          actions={
            <Button onClick={handleAddContact} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Contact
            </Button>
          }
        />
        <EmptyState
          icon={<Users className="h-12 w-12 text-[#d1d5db]" />}
          title="No contacts yet"
          description="Add your first customer or vendor to start creating sales and purchase transactions."
          action={
            <Button onClick={handleAddContact} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Contact
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Contacts"
        description="Manage customers and vendors used across sales and purchase transactions."
        actions={
          <Button onClick={handleAddContact} className="bg-[#1a2a3a] hover:bg-[#2a3f56]">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Contact
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-[#e5e7eb]">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search contacts..."
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
            <option value="ALL">All</option>
            <option value="CUSTOMER">Customer</option>
            <option value="VENDOR">Vendor</option>
            <option value="BOTH">Both</option>
          </select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[#6b7280]">
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
        <div className="text-sm text-[#6b7280]">
          Showing {paginatedContacts.length} of {totalItems}
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 border border-[#e5e7eb] rounded-md overflow-x-auto">
        <table className="min-w-full divide-y divide-[#e5e7eb]">
          <thead className="bg-[#f9fafb]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Mobile</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Location</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#6b7280] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#e5e7eb]">
            {isLoading ? (
              renderSkeletonRows()
            ) : paginatedContacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-[#6b7280]">
                  No contacts found
                </td>
              </tr>
            ) : (
              paginatedContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ContactAvatar name={contact.name} imageUrl={contact.profileImage} size="sm" />
                      <div className="font-medium text-[#1a2332]">{contact.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#1a2332]">{contact.email || '-'}</td>
                  <td className="px-4 py-3 text-sm text-[#1a2332]">{contact.mobile || '-'}</td>
                  <td className="px-4 py-3 text-sm text-[#1a2332]">
                    {contact.city && contact.state ? `${contact.city}, ${contact.state}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <ContactTypeBadge type={contact.type} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewContact(contact)}
                        className="p-1 text-[#6b7280] hover:text-[#1a2a3a] transition-colors"
                        aria-label="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditContact(contact)}
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

      {/* Pagination */}
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
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add Contact">
        <ContactForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
          isSubmitting={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Contact">
        {selectedContact && (
          <ContactForm
            initialData={selectedContact}
            onSubmit={handleUpdateSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedContact(null);
            }}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Contact Details">
        {selectedContact && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ContactAvatar name={selectedContact.name} imageUrl={selectedContact.profileImage} size="lg" />
              <div>
                <div className="text-lg font-semibold text-[#1a2332]">{selectedContact.name}</div>
                <ContactTypeBadge type={selectedContact.type} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[#6b7280]">Email</div>
                <div className="text-[#1a2332]">{selectedContact.email || '-'}</div>
              </div>
              <div>
                <div className="text-[#6b7280]">Mobile</div>
                <div className="text-[#1a2332]">{selectedContact.mobile || '-'}</div>
              </div>
              <div>
                <div className="text-[#6b7280]">City</div>
                <div className="text-[#1a2332]">{selectedContact.city || '-'}</div>
              </div>
              <div>
                <div className="text-[#6b7280]">State</div>
                <div className="text-[#1a2332]">{selectedContact.state || '-'}</div>
              </div>
              <div>
                <div className="text-[#6b7280]">Pincode</div>
                <div className="text-[#1a2332]">{selectedContact.pincode || '-'}</div>
              </div>
            </div>
            <div>
              <div className="text-[#6b7280] text-sm">Address</div>
              <div className="text-[#1a2332] text-sm">{selectedContact.address || '-'}</div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-[#e5e7eb]">
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditContact(selectedContact);
                }}
                className="bg-[#1a2a3a] hover:bg-[#2a3f56]"
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit Contact
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
