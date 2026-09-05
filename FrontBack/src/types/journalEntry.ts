export type JournalEntryStatus = 'Draft' | 'Posted' | 'Cancelled';
export interface JournalEntryLine { id: string; accountId: string; accountName?: string; description?: string; debit: number; credit: number; }
export interface JournalEntry { id: string; entryNumber: string; entryDate: string; journalId: string; journalName?: string; reference?: string; description?: string; status: JournalEntryStatus; lines: JournalEntryLine[]; totalDebit: number; totalCredit: number; }
export type JournalEntryInput = Omit<JournalEntry, 'id' | 'journalName' | 'status' | 'totalDebit' | 'totalCredit' | 'lines'> & { lines: Omit<JournalEntryLine, 'id' | 'accountName'>[] };
export interface JournalEntryFilters { search?: string; status?: JournalEntryStatus | 'ALL'; journalId?: string; fromDate?: string; toDate?: string; }
