import type { AnalyticAccount, AnalyticAccountInput, AnalyticAccountFilters, AnalyticAccountType } from '@/types/analyticAccount';
import { api } from '@/lib/api';

interface BackendAnalytic {
  id: string;
  name: string;
  type: 'Income' | 'Expense';
  is_active: boolean;
}
const IN: Record<BackendAnalytic['type'], AnalyticAccountType> = { Income: 'income', Expense: 'expense' };
const OUT: Record<AnalyticAccountType, BackendAnalytic['type']> = { income: 'Income', expense: 'Expense' };
function toAnalytic(a: BackendAnalytic): AnalyticAccount {
  return { id: a.id, name: a.name, type: IN[a.type] };
}

export const analyticAccountService = {
  getAnalyticAccounts: async (filters?: AnalyticAccountFilters): Promise<AnalyticAccount[]> => {
    let result = (await api.get<BackendAnalytic[]>('/api/analytics/')).map(toAnalytic);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((a) => a.name.toLowerCase().includes(q));
    }
    if (filters?.type && filters.type !== 'ALL') result = result.filter((a) => a.type === filters.type);
    return result;
  },
  getAnalyticAccount: async (id: string): Promise<AnalyticAccount | undefined> =>
    (await analyticAccountService.getAnalyticAccounts()).find((a) => a.id === id),
  createAnalyticAccount: async (input: AnalyticAccountInput): Promise<AnalyticAccount> =>
    toAnalytic(await api.post<BackendAnalytic>('/api/analytics/', { name: input.name, type: OUT[input.type] })),
  updateAnalyticAccount: async (id: string, data: Partial<AnalyticAccountInput>): Promise<AnalyticAccount> => {
    const body: Record<string, unknown> = {};
    if (data.name !== undefined) body.name = data.name;
    if (data.type !== undefined) body.type = OUT[data.type];
    return toAnalytic(await api.put<BackendAnalytic>(`/api/analytics/${id}`, body));
  },
};
