import type { Journal, JournalInput, JournalFilters } from '@/types/journal';

// Default journals as per spec
const mockJournals: Journal[] = [
  { id: '1', name: 'Sales', type: 'sales' },
  { id: '2', name: 'Purchase', type: 'purchase' },
  { id: '3', name: 'Bank', type: 'bank' },
  { id: '4', name: 'Cash', type: 'cash' },
];

let journals = [...mockJournals];
let nextId = journals.length + 1;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const journalService = {
  getJournals: async (filters?: JournalFilters): Promise<Journal[]> => {
    await delay(500);
    let result = [...journals];

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(j => j.name.toLowerCase().includes(searchLower));
    }

    if (filters?.type && filters.type !== 'ALL') {
      result = result.filter(j => j.type === filters.type);
    }

    return result;
  },

  getJournal: async (id: string): Promise<Journal | undefined> => {
    await delay(300);
    return journals.find(j => j.id === id);
  },

  createJournal: async (input: JournalInput): Promise<Journal> => {
    await delay(600);
    const newJournal: Journal = {
      ...input,
      id: String(nextId++),
    };
    journals.push(newJournal);
    return newJournal;
  },

  updateJournal: async (id: string, input: Partial<JournalInput>): Promise<Journal> => {
    await delay(600);
    const index = journals.findIndex(j => j.id === id);
    if (index === -1) throw new Error('Journal not found');
    const updated = { ...journals[index], ...input };
    journals[index] = updated;
    return updated;
  },
};