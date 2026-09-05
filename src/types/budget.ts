export interface Budget {
  id: string;
  name: string;
  period: string;
  responsible: string;
  plannedAmount: number;
  analyticAccountId: string;
  analyticAccountName?: string; // resolved for display
}

export type BudgetInput = Omit<Budget, 'id' | 'analyticAccountName'>;

export interface BudgetFilters {
  search?: string;
  period?: string;
  analyticAccountId?: string;
}