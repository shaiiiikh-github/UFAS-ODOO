export type AccountType = 'asset' | 'liability' | 'expense' | 'income' | 'capital';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
}

export type AccountInput = Omit<Account, 'id'>;

export interface AccountFilters {
  search?: string;
  type?: AccountType | 'ALL';
}