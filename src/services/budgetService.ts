import type { Budget, BudgetInput, BudgetFilters } from '@/types/budget';

// Sample budgets with references to analytic accounts (IDs from analyticAccountService)
const mockBudgets: Budget[] = [
  {
    id: '1',
    name: 'Sales Target Q1',
    period: 'Q1 2025',
    responsible: 'Rahul Kumar',
    plannedAmount: 500000,
    analyticAccountId: '1', // Retail Sales
    analyticAccountName: 'Retail Sales',
  },
  {
    id: '2',
    name: 'Marketing Budget Q2',
    period: 'Q2 2025',
    responsible: 'Priya Sharma',
    plannedAmount: 75000,
    analyticAccountId: '7', // Marketing
    analyticAccountName: 'Marketing',
  },
  {
    id: '3',
    name: 'Office Expenses Q1',
    period: 'Q1 2025',
    responsible: 'Arjun Mehta',
    plannedAmount: 120000,
    analyticAccountId: '4', // Office Expenses
    analyticAccountName: 'Office Expenses',
  },
  {
    id: '4',
    name: 'Sales Target Q2',
    period: 'Q2 2025',
    responsible: 'Rahul Kumar',
    plannedAmount: 550000,
    analyticAccountId: '2', // Furniture Sales
    analyticAccountName: 'Furniture Sales',
  },
  {
    id: '5',
    name: 'Utilities Budget FY2025',
    period: 'FY 2025',
    responsible: 'Sneha Patel',
    plannedAmount: 90000,
    analyticAccountId: '6', // Utilities
    analyticAccountName: 'Utilities',
  },
];

let budgets = [...mockBudgets];
let nextId = budgets.length + 1;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const budgetService = {
  getBudgets: async (filters?: BudgetFilters): Promise<Budget[]> => {
    await delay(500);
    let result = [...budgets];

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(b =>
        b.name.toLowerCase().includes(searchLower) ||
        b.responsible.toLowerCase().includes(searchLower) ||
        (b.analyticAccountName && b.analyticAccountName.toLowerCase().includes(searchLower))
      );
    }

    if (filters?.period) {
      result = result.filter(b => b.period === filters.period);
    }

    if (filters?.analyticAccountId) {
      result = result.filter(b => b.analyticAccountId === filters.analyticAccountId);
    }

    return result;
  },

  getBudget: async (id: string): Promise<Budget | undefined> => {
    await delay(300);
    return budgets.find(b => b.id === id);
  },

  createBudget: async (input: BudgetInput): Promise<Budget> => {
    await delay(600);
    // Resolve analytic account name from the ID (mock)
    const analyticAccountName = mockAnalyticAccounts.find(a => a.id === input.analyticAccountId)?.name || '';
    const newBudget: Budget = {
      ...input,
      id: String(nextId++),
      analyticAccountName,
    };
    budgets.push(newBudget);
    return newBudget;
  },

  updateBudget: async (id: string, input: Partial<BudgetInput>): Promise<Budget> => {
    await delay(600);
    const index = budgets.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Budget not found');
    const updated = { ...budgets[index], ...input };
    // If analyticAccountId changed, resolve new name
    if (input.analyticAccountId) {
      const analyticAccountName = mockAnalyticAccounts.find(a => a.id === input.analyticAccountId)?.name || '';
      updated.analyticAccountName = analyticAccountName;
    }
    budgets[index] = updated;
    return updated;
  },

  deleteBudget: async (id: string): Promise<void> => {
    await delay(400);
    budgets = budgets.filter(b => b.id !== id);
  },
};

// Temporary mock for analytic account names resolution (should come from analyticAccountService)
// We'll reuse the same mock data as in analyticAccountService to keep consistency.
const mockAnalyticAccounts = [
  { id: '1', name: 'Retail Sales', type: 'income' },
  { id: '2', name: 'Furniture Sales', type: 'income' },
  { id: '3', name: 'Service Income', type: 'income' },
  { id: '4', name: 'Office Expenses', type: 'expense' },
  { id: '5', name: 'Transportation', type: 'expense' },
  { id: '6', name: 'Utilities', type: 'expense' },
  { id: '7', name: 'Marketing', type: 'expense' },
];