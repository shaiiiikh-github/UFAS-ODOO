import React, { useEffect, useState } from 'react';
import { getBalanceSheet, getPnL, getBudgetReport, listAccountBalances } from '../api/endpoints';
import { money } from '../utils/format';

export default function Dashboard() {
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [pnl, setPnl] = useState(null);
  const [budgetReport, setBudgetReport] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [bs, pl, br, ab] = await Promise.all([
      getBalanceSheet(),
      getPnL(),
      getBudgetReport(),
      listAccountBalances(),
    ]);
    setBalanceSheet(bs);
    setPnl(pl);
    setBudgetReport(br);
    setBalances(ab);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="page-loading">Loading dashboard…</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Executive Overview</h2>
        <button className="btn btn-secondary" onClick={load}>🔄 Refresh</button>
      </div>

      <div className="grid grid-3">
        <div className="card">
          <h3>Balance Sheet</h3>
          <ul className="kv-list">
            <li><span>Assets</span><b>{money(balanceSheet.assets)}</b></li>
            <li><span>Liabilities</span><b>{money(balanceSheet.liabilities)}</b></li>
            <li><span>Equity</span><b>{money(balanceSheet.equity)}</b></li>
            <li><span>Net Profit</span><b>{money(balanceSheet.net_profit)}</b></li>
            <li><span>Liabilities + Equity</span><b>{money(balanceSheet.total_liabilities_and_equity)}</b></li>
          </ul>
          <span className={`badge ${balanceSheet.balanced ? 'badge-success' : 'badge-error'}`}>
            {balanceSheet.balanced ? 'Balanced' : 'Out of balance'}
          </span>
        </div>

        <div className="card">
          <h3>Profit &amp; Loss</h3>
          <ul className="kv-list">
            <li><span>Total Income</span><b>{money(pnl.total_income)}</b></li>
            <li><span>Total Expense</span><b>{money(pnl.total_expense)}</b></li>
            <li className="highlight"><span>Net Profit</span><b>{money(pnl.net_profit)}</b></li>
          </ul>
        </div>

        <div className="card">
          <h3>Live Chart of Accounts</h3>
          <table className="table table-compact">
            <thead><tr><th>Account</th><th>Type</th><th>Balance</th></tr></thead>
            <tbody>
              {balances.map((a) => (
                <tr key={a.id}>
                  <td>{a.code} · {a.name}</td>
                  <td>{a.type}</td>
                  <td>{money(a.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card grid-span-2">
          <h3>Budget Variance</h3>
          <table className="table">
            <thead><tr><th>Budget</th><th>Planned</th><th>Actual</th><th>Variance</th><th>Utilization</th></tr></thead>
            <tbody>
              {budgetReport.map((b) => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  <td>{money(b.planned)}</td>
                  <td>{money(b.actual)}</td>
                  <td className={Number(b.variance) >= 0 ? 'text-success' : 'text-error'}>{money(b.variance)}</td>
                  <td>{Number(b.utilization_percent).toFixed(1)}%</td>
                </tr>
              ))}
              {budgetReport.length === 0 && <tr><td colSpan={5} className="empty">No budgets defined yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}