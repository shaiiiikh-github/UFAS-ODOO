import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { journalService } from '@/services/journalService';
import type { Journal, JournalInput, JournalFilters } from '@/types/journal';
import { toast } from 'sonner';

export const JOURNALS_QUERY_KEY = 'journals';

export const useJournals = (filters?: JournalFilters) => {
  return useQuery({
    queryKey: [JOURNALS_QUERY_KEY, filters],
    queryFn: () => journalService.getJournals(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useJournal = (id: string) => {
  return useQuery({
    queryKey: [JOURNALS_QUERY_KEY, id],
    queryFn: () => journalService.getJournal(id),
    enabled: !!id,
  });
};

export const useCreateJournal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: JournalInput) => journalService.createJournal(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [JOURNALS_QUERY_KEY] });
      toast.success('Journal created successfully.');
    },
    onError: () => {
      toast.error('Failed to create journal.');
    },
  });
};

export const useUpdateJournal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JournalInput> }) =>
      journalService.updateJournal(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [JOURNALS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [JOURNALS_QUERY_KEY, updated.id] });
      toast.success('Journal updated successfully.');
    },
    onError: () => {
      toast.error('Failed to update journal.');
    },
  });
};