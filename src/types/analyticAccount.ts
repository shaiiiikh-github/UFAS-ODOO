export type AnalyticAccountType = 'income' | 'expense';

export interface AnalyticAccount {
  id: string;
  name: string;
  type: AnalyticAccountType;
}

export type AnalyticAccountInput = Omit<AnalyticAccount, 'id'>;

export interface AnalyticAccountFilters {
  search?: string;
  type?: AnalyticAccountType | 'ALL';
}