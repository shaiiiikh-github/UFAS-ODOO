import { useQuery } from '@tanstack/react-query'; import { ledgerService } from '@/services/ledgerService'; import type { LedgerFilters } from '@/types/ledger';
export const useLedger = (filters: LedgerFilters) => useQuery({ queryKey: ['ledger', filters], queryFn: () => ledgerService.getLedger(filters), enabled: !!filters.accountId });
