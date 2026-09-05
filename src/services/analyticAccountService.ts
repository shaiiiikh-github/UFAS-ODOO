import type { AnalyticAccount, AnalyticAccountInput, AnalyticAccountFilters } from '@/types/analyticAccount';

// Mock data with default analytic accounts
const mockAnalyticAccounts: AnalyticAccount[] = [
  { id: '1', name: 'Retail Sales', type: 'income' },
  { id: '2', name: 'Furniture Sales', type: 'income' },
  { id: '3', name: 'Service Income', type: 'income' },
  { id: '4', name: 'Office Expenses', type: 'expense' },
  { id: '5', name: 'Transportation', type: 'expense' },
  { id: '6', name: 'Utilities', type: 'expense' },
  { id: '7', name: 'Marketing', type: 'expense' },
];

let analyticAccounts = [...mockAnalyticAccounts];
let nextId = analyticAccounts.length + 1;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyticAccountService = {
  getAnalyticAccounts: async (filters?: AnalyticAccountFilters): Promise<AnalyticAccount[]> => {
    await delay(500);
    let result = [...analyticAccounts];

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(a => a.name.toLowerCase().includes(searchLower));
    }

    if (filters?.type && filters.type !== 'ALL') {
      result = result.filter(a => a.type === filters.type);
    }

    return result;
  },

  getAnalyticAccount: async (id: string): Promise<AnalyticAccount | undefined> => {
    await delay(300);
    return analyticAccounts.find(a => a.id === id);
  },

  createAnalyticAccount: async (input: AnalyticAccountInput): Promise<AnalyticAccount> => {
    await delay(600);
    const newAccount: AnalyticAccount = {
      ...input,
      id: String(nextId++),
    };
    analyticAccounts.push(newAccount);
    return newAccount;
  },

  updateAnalyticAccount: async (id: string, input: Partial<AnalyticAccountInput>): Promise<AnalyticAccount> => {
    await delay(600);
    const index = analyticAccounts.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Analytic account not found');
    const updated = { ...analyticAccounts[index], ...input };
    analyticAccounts[index] = updated;
    return updated;
  },
};