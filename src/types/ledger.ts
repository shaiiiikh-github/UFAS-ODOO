export interface LedgerFilters { accountId?: string; journalId?: string; fromDate?: string; toDate?: string; }
export interface LedgerRow { id: string; entryId: string; date: string; entryNumber: string; reference?: string; description?: string; journalId: string; debit: number; credit: number; balance: number; }
export interface LedgerReport { accountId: string; accountName: string; openingBalance: number; totalDebit: number; totalCredit: number; closingBalance: number; rows: LedgerRow[]; }
