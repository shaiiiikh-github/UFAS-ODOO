import type { BudgetReport, BudgetReportFilters, BudgetReportRow } from '@/types/budgetReport';
import { api, num } from '@/lib/api';

interface BackendBudgetReportRow {
  id: string;
  name: string;
  analytic_account_id: string;
  analytic_account_name: string | null;
  period_start: string;
  period_end: string;
  responsible_person: string;
  planned: number | string;
  actual: number | string;
  variance: number | string;
  utilization_percent: number | string;
}

export const budgetReportService = {
  async getBudgetReport(filters?: BudgetReportFilters): Promise<BudgetReport> {
    const raw = await api.get<BackendBudgetReportRow[]>('/api/reports/budget');
    let rows: BudgetReportRow[] = raw.map((r) => ({
      budgetId: r.id,
      budgetName: r.name,
      period: `${r.period_start} to ${r.period_end}`,
      analyticAccountId: r.analytic_account_id,
      analyticAccountName: r.analytic_account_name ?? undefined,
      plannedAmount: num(r.planned),
      actualAmount: num(r.actual),
      variance: num(r.variance),
    }));
    if (filters?.period) rows = rows.filter((r) => r.period === filters.period);
    if (filters?.analyticAccountId) rows = rows.filter((r) => r.analyticAccountId === filters.analyticAccountId);
    return {
      rows,
      totalPlanned: rows.reduce((s, r) => s + r.plannedAmount, 0),
      totalActual: rows.reduce((s, r) => s + r.actualAmount, 0),
      totalVariance: rows.reduce((s, r) => s + r.variance, 0),
    };
  },
};
