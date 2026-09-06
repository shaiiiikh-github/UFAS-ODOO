import type { Account, AccountInput, AccountFilters, AccountType } from '@/types/account';
import { api } from '@/lib/api';

type BackendAccountType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
interface BackendAccount {
  id: string;
  code: string;
  name: string;
  type: BackendAccountType;
  is_active: boolean;
}

const TYPE_IN: Record<BackendAccountType, AccountType> = {
  Asset: 'asset', Liability: 'liability', Equity: 'capital', Income: 'income', Expense: 'expense',
};
const TYPE_OUT: Record<AccountType, BackendAccountType> = {
  asset: 'Asset', liability: 'Liability', capital: 'Equity', income: 'Income', expense: 'Expense',
};
// Typical CoA leading digit per class; used only to synthesize a code the backend requires.
const CODE_PREFIX: Record<AccountType, string> = { asset: '1', liability: '2', capital: '3', income: '4', expense: '5' };

function toAccount(a: BackendAccount): Account {
  return { id: a.id, name: a.name, type: TYPE_IN[a.type] };
}

export const accountService = {
  getAccounts: async (filters?: AccountFilters): Promise<Account[]> => {
    let result = (await api.get<BackendAccount[]>('/api/chart-of-accounts/')).map(toAccount);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((a) => a.name.toLowerCase().includes(q));
    }
    if (filters?.type && filters.type !== 'ALL') result = result.filter((a) => a.type === filters.type);
    return result;
  },
  getAccount: async (id: string): Promise<Account | undefined> => (await accountService.getAccounts()).find((a) => a.id === id),
  createAccount: async (input: AccountInput): Promise<Account> => {
    // Backend requires a unique account code; the frontend form has no code field, so synthesize one.
    const code = `${CODE_PREFIX[input.type]}${Date.now().toString().slice(-6)}`;
    return toAccount(await api.post<BackendAccount>('/api/chart-of-accounts/', { code, name: input.name, type: TYPE_OUT[input.type] }));
  },
  updateAccount: async (id: string, data: Partial<AccountInput>): Promise<Account> => {
    const body: Record<string, unknown> = {};
    if (data.name !== undefined) body.name = data.name;
    if (data.type !== undefined) body.type = TYPE_OUT[data.type];
    return toAccount(await api.put<BackendAccount>(`/api/chart-of-accounts/${id}`, body));
  },
};
