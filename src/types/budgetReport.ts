export interface BudgetReportFilters { period?: string; analyticAccountId?: string; }
export interface BudgetReportRow { budgetId: string; budgetName: string; period: string; analyticAccountId: string; analyticAccountName?: string; plannedAmount: number; actualAmount: number; variance: number; }
export interface BudgetReport { rows: BudgetReportRow[]; totalPlanned: number; totalActual: number; totalVariance: number; }
