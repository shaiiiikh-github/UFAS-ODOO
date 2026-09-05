export type JournalType = 'sales' | 'purchase' | 'bank' | 'cash';

export interface Journal {
  id: string;
  name: string;
  type: JournalType;
}

export type JournalInput = Omit<Journal, 'id'>;

export interface JournalFilters {
  search?: string;
  type?: JournalType | 'ALL';
}