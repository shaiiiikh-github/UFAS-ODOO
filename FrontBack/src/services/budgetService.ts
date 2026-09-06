import type { Budget, BudgetInput, BudgetFilters } from '@/types/budget';
import { api } from '@/lib/api';
import { analyticAccountService } from '@/services/analyticAccountService';

interface BackendBudget {
  id: string;
  name: string;
  analytic_account_id: string;
  planned_amount: number | string;
  period_start: string;
  period_end: string;
  responsible_person: string;
  is_active: boolean;
}

// The frontend stores `period` as a single free-text string; the backend needs
// two dates. Recommended input format: "YYYY-MM-DD to YYYY-MM-DD".
// Also accepts a single "YYYY-MM" month or "YYYY" year.
function parsePeriod(period: string): { period_start: string; period_end: string } {
  const range = period.match(/(\d{4}-\d{2}-\d{2})\s*(?:to|-|–|—)\s*(\d{4}-\d{2}-\d{2})/i);
  if (range) return { period_start: range[1], period_end: range[2] };
  const month = period.match(/^(\d{4})-(\d{2})$/);
  if (month) {
    const y = Number(month[1]);
    const m = Number(month[2]);
    const last = new Date(y, m, 0).getDate();
    return { period_start: `${month[1]}-${month[2]}-01`, period_end: `${month[1]}-${month[2]}-${String(last).padStart(2, '0')}` };
  }
  const year = period.match(/^(\d{4})$/);
  if (year) return { period_start: `${year[1]}-01-01`, period_end: `${year[1]}-12-31` };
  throw new Error('Period must be a date range like "2025-01-01 to 2025-03-31" (or a "YYYY-MM" month / "YYYY" year).');
}

function toBudget(b: BackendBudget, nameById: Map<string, string>): Budget {
  return {
    id: b.id,
    name: b.name,
    period: `${b.period_start} to ${b.period_end}`,
    responsible: b.responsible_person,
    plannedAmount: Number(b.planned_amount),
    analyticAccountId: b.analytic_account_id,
    analyticAccountName: nameById.get(b.analytic_account_id),
  };
}

async function analyticNameMap(): Promise<Map<string, string>> {
  const analytics = await analyticAccountService.getAnalyticAccounts();
  return new Map(analytics.map((a) => [a.id, a.name]));
}

export const budgetService = {
  getBudgets: async (filters?: BudgetFilters): Promise<Budget[]> => {
    const [raw, names] = await Promise.all([api.get<BackendBudget[]>('/api/budgets/'), analyticNameMap()]);
    let result = raw.map((b) => toBudget(b, names));
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((b) => b.name.toLowerCase().includes(q) || b.responsible.toLowerCase().includes(q));
    }
    if (filters?.period) result = result.filter((b) => b.period === filters.period);
    if (filters?.analyticAccountId) result = result.filter((b) => b.analyticAccountId === filters.analyticAccountId);
    return result;
  },
  getBudget: async (id: string): Promise<Budget | undefined> => (await budgetService.getBudgets()).find((b) => b.id === id),
  createBudget: async (input: BudgetInput): Promise<Budget> => {
    const { period_start, period_end } = parsePeriod(input.period);
    const created = await api.post<BackendBudget>('/api/budgets/', {
      name: input.name,
      analytic_account_id: input.analyticAccountId,
      planned_amount: input.plannedAmount,
      period_start,
      period_end,
      responsible_person: input.responsible,
    });
    return toBudget(created, await analyticNameMap());
  },
  updateBudget: async (id: string, data: Partial<BudgetInput>): Promise<Budget> => {
    const body: Record<string, unknown> = {};
    if (data.name !== undefined) body.name = data.name;
    if (data.analyticAccountId !== undefined) body.analytic_account_id = data.analyticAccountId;
    if (data.plannedAmount !== undefined) body.planned_amount = data.plannedAmount;
    if (data.responsible !== undefined) body.responsible_person = data.responsible;
    if (data.period !== undefined) Object.assign(body, parsePeriod(data.period));
    const updated = await api.put<BackendBudget>(`/api/budgets/${id}`, body);
    return toBudget(updated, await analyticNameMap());
  },
  // Backend has no delete; archive is the soft-delete equivalent.
  deleteBudget: async (id: string): Promise<void> => {
    await api.post(`/api/budgets/${id}/archive`);
  },
};
