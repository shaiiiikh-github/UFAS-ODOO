import type { Account, AccountInput, AccountFilters } from '@/types/account';

// Mock data with default accounts
const mockAccounts: Account[] = [
  { id: '1', name: 'Cash', type: 'asset' },
  { id: '2', name: 'Bank', type: 'asset' },
  { id: '3', name: 'Debtors', type: 'asset' },
  { id: '4', name: 'Creditors', type: 'liability' },
  { id: '5', name: 'Sale Income', type: 'income' },
  { id: '6', name: 'Purchases Expense', type: 'expense' },
  { id: '7', name: 'Office Equipment', type: 'asset' },
  { id: '8', name: 'Bank Loan', type: 'liability' },
  { id: '9', name: 'Capital', type: 'capital' },
  { id: '10', name: 'Rent Expense', type: 'expense' },
  { id: '11', name: 'Salary Expense', type: 'expense' },
  { id: '12', name: 'Commission Income', type: 'income' },
];

const accounts = [...mockAccounts];
let nextId = accounts.length + 1;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const accountService = {
  getAccounts: async (filters?: AccountFilters): Promise<Account[]> => {
    await delay(500);
    let result = [...accounts];

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.type && filters.type !== 'ALL') {
      result = result.filter(a => a.type === filters.type);
    }

    return result;
  },

  getAccount: async (id: string): Promise<Account | undefined> => {
    await delay(300);
    return accounts.find(a => a.id === id);
  },

  createAccount: async (input: AccountInput): Promise<Account> => {
    await delay(600);
    const newAccount: Account = {
      ...input,
      id: String(nextId++),
    };
    accounts.push(newAccount);
    return newAccount;
  },

  updateAccount: async (id: string, input: Partial<AccountInput>): Promise<Account> => {
    await delay(600);
    const index = accounts.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Account not found');
    const updated = { ...accounts[index], ...input };
    accounts[index] = updated;
    return updated;
  },
};
