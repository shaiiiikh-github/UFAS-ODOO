export interface BalanceSheetLine { accountId: string; accountName: string; amount: number; }
export interface BalanceSheetReport { assets: BalanceSheetLine[]; liabilities: BalanceSheetLine[]; capital: BalanceSheetLine[]; totalAssets: number; totalLiabilities: number; totalCapital: number; difference: number; }
