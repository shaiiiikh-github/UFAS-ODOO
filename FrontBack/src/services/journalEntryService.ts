import type { JournalEntry, JournalEntryFilters, JournalEntryInput, JournalEntryStatus } from '@/types/journalEntry';
import { api, num } from '@/lib/api';

interface BackendItem {
  id: string;
  entry_id: string;
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  analytic_account_id: string | null;
  debit: number | string;
  credit: number | string;
}
interface BackendEntry {
  id: string;
  date: string;
  reference: string;
  status: string;
  journal_id: string | null;
  journal_name: string | null;
  total_debit: number | string;
  total_credit: number | string;
  balanced: boolean;
  items: BackendItem[];
}

function toEntry(e: BackendEntry): JournalEntry {
  return {
    id: e.id,
    entryNumber: e.reference || `JE-${e.id.slice(0, 8).toUpperCase()}`,
    entryDate: e.date,
    journalId: e.journal_id ?? '',
    journalName: e.journal_name ?? undefined,
    reference: e.reference,
    description: '',
    status: (e.status as JournalEntryStatus) || 'Posted',
    lines: e.items.map((it) => ({
      id: it.id,
      accountId: it.account_id,
      accountName: it.account_name,
      description: '',
      debit: num(it.debit),
      credit: num(it.credit),
    })),
    totalDebit: num(e.total_debit),
    totalCredit: num(e.total_credit),
  };
}

function toPayload(input: JournalEntryInput) {
  return {
    date: input.entryDate,
    reference: input.reference || input.entryNumber || '',
    journal_id: input.journalId || null,
    items: input.lines.map((l) => ({
      account_id: l.accountId,
      debit: l.debit || 0,
      credit: l.credit || 0,
    })),
  };
}

export const journalEntryService = {
  async getJournalEntries(filters?: JournalEntryFilters): Promise<JournalEntry[]> {
    let result = (await api.get<BackendEntry[]>('/api/journal-entries/')).map(toEntry);
    const search = filters?.search?.toLowerCase();
    if (search) {
      result = result.filter(
        (e) =>
          e.entryNumber.toLowerCase().includes(search) ||
          (e.reference?.toLowerCase().includes(search) ?? false) ||
          (e.description?.toLowerCase().includes(search) ?? false),
      );
    }
    if (filters?.status && filters.status !== 'ALL') result = result.filter((e) => e.status === filters.status);
    if (filters?.journalId) result = result.filter((e) => e.journalId === filters.journalId);
    if (filters?.fromDate) result = result.filter((e) => e.entryDate >= filters.fromDate!);
    if (filters?.toDate) result = result.filter((e) => e.entryDate <= filters.toDate!);
    return result;
  },
  async createJournalEntry(input: JournalEntryInput): Promise<JournalEntry> {
    return toEntry(await api.post<BackendEntry>('/api/journal-entries/', toPayload(input)));
  },
  async updateJournalEntry(id: string, input: JournalEntryInput): Promise<JournalEntry> {
    return toEntry(await api.put<BackendEntry>(`/api/journal-entries/${id}`, toPayload(input)));
  },
  async postJournalEntry(id: string): Promise<JournalEntry> {
    return toEntry(await api.post<BackendEntry>(`/api/journal-entries/${id}/post`));
  },
  async cancelJournalEntry(id: string): Promise<JournalEntry> {
    return toEntry(await api.post<BackendEntry>(`/api/journal-entries/${id}/cancel`));
  },
};
