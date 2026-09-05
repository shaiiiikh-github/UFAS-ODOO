export interface ProfitLossFilters { fromDate?: string; toDate?: string; }
export interface ProfitLossLine { accountId: string; accountName: string; amount: number; }
export interface ProfitLossReport { income: ProfitLossLine[]; expenses: ProfitLossLine[]; totalIncome: number; totalExpenses: number; netProfit: number; }
