import type { Journal, JournalInput, JournalFilters, JournalType } from '@/types/journal';
import { api } from '@/lib/api';

interface BackendJournal {
  id: string;
  name: string;
  type: string;
  default_account_id: string | null;
  default_account_name: string | null;
  is_active: boolean;
}

const KNOWN: JournalType[] = ['sales', 'purchase', 'bank', 'cash'];
function typeIn(backendType: string): JournalType {
  const lower = backendType.toLowerCase() as JournalType;
  return KNOWN.includes(lower) ? lower : 'bank';
}
function typeOut(t: JournalType): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}
function toJournal(j: BackendJournal): Journal {
  return { id: j.id, name: j.name, type: typeIn(j.type) };
}

export const journalService = {
  getJournals: async (filters?: JournalFilters): Promise<Journal[]> => {
    let result = (await api.get<BackendJournal[]>('/api/journals/')).map(toJournal);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((j) => j.name.toLowerCase().includes(q));
    }
    if (filters?.type && filters.type !== 'ALL') result = result.filter((j) => j.type === filters.type);
    return result;
  },
  getJournal: async (id: string): Promise<Journal | undefined> => (await journalService.getJournals()).find((j) => j.id === id),
  createJournal: async (input: JournalInput): Promise<Journal> =>
    toJournal(await api.post<BackendJournal>('/api/journals/', { name: input.name, type: typeOut(input.type) })),
  updateJournal: async (id: string, data: Partial<JournalInput>): Promise<Journal> => {
    const body: Record<string, unknown> = {};
    if (data.name !== undefined) body.name = data.name;
    if (data.type !== undefined) body.type = typeOut(data.type);
    return toJournal(await api.put<BackendJournal>(`/api/journals/${id}`, body));
  },
};
