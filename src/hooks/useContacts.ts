import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactService } from '@/services/contactService';
import type { ContactInput, ContactFilters } from '@/types/contact';
import { toast } from 'sonner';

export const CONTACTS_QUERY_KEY = 'contacts';

export const useContacts = (filters?: ContactFilters) => {
  return useQuery({
    queryKey: [CONTACTS_QUERY_KEY, filters],
    queryFn: () => contactService.getContacts(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useContact = (id: string) => {
  return useQuery({
    queryKey: [CONTACTS_QUERY_KEY, id],
    queryFn: () => contactService.getContact(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ContactInput) => contactService.createContact(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
      toast.success('Contact created successfully.');
    },
    onError: () => {
      toast.error('Failed to create contact.');
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContactInput> }) =>
      contactService.updateContact(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY, updated.id] });
      toast.success('Contact updated successfully.');
    },
    onError: () => {
      toast.error('Failed to update contact.');
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contactService.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
      toast.success('Contact deleted.');
    },
    onError: () => {
      toast.error('Failed to delete contact.');
    },
  });
};
