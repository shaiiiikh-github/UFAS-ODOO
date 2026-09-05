import React, { useEffect, useState } from 'react';
import * as api from '../api/endpoints';
import { money } from '../utils/format';

export default function Reports() {
  const [asOfDate, setAsOfDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [balanceSheet, setBalanceSheet] = useState(null);
  const [pnl, setPnl] = useState(null);
  const [budgetReport, setBudgetReport] = useState([]);
  const [balances, setBalances] = useState([]);
  const [stock, setStock] = useState([]);
  const [includeArchivedStock, setIncludeArchivedStock] = useState(false);

  const runReports = async () => {
    const [bs, pl, br, ab, st] = await Promise.all([
      api.getBalanceSheet(asOfDate),
      api.getPnL(startDate, endDate),
      api.getBudgetReport(asOfDate),
      api.listAccountBalances(asOfDate),
      api.getStockReport(includeArchivedStock),
    ]);
    setBalanceSheet(bs); setPnl(pl); setBudgetReport(br); setBalances(ab); setStock(st);
  };

  useEffect(() => { runReports(); }, []);

  return (
    <div>
      <div className="page-header"><h2>Reports</h2></div>

      <div className="card">
        <h3>Filters</h3>
        <div className="form-grid">
          <label className="inline-label">As of date
            <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
          </label>
          <label className="inline-label">P&amp;L start
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label className="inline-label">P&amp;L end
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
          <label className="checkbox-inline">
            <input type="checkbox" checked={includeArchivedStock} onChange={(e) => setIncludeArchivedStock(e.target.checked)} />
            Include archived products in stock report
          </label>
          <button className="btn btn-primary" onClick={runReports}>Run reports</button>
        </div>
      </div>

      {balanceSheet && (
        <div className="card">
          <h3>Balance Sheet</h3>
          <table className="table table-compact">
            <tbody>
              <tr><td>Assets</td><td>{money(balanceSheet.assets)}</td></tr>
              <tr><td>Liabilities</td><td>{money(balanceSheet.liabilities)}</td></tr>
              <tr><td>Equity</td><td>{money(balanceSheet.equity)}</td></tr>
              <tr><td>Net Profit</td><td>{money(balanceSheet.net_profit)}</td></tr>
              <tr><td>Liabilities + Equity</td><td>{money(balanceSheet.total_liabilities_and_equity)}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {pnl && (
        <div className="card">
          <h3>Profit &amp; Loss</h3>
          <table className="table table-compact">
            <tbody>
              <tr><td>Total Income</td><td>{money(pnl.total_income)}</td></tr>
              <tr><td>Total Expense</td><td>{money(pnl.total_expense)}</td></tr>
              <tr><td>Net Profit</td><td>{money(pnl.net_profit)}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h3>Budget Report</h3>
        <table className="table">
          <thead><tr><th>Name</th><th>Analytic</th><th>Responsible</th><th>Planned</th><th>Actual</th><th>Variance</th><th>Util %</th></tr></thead>
          <tbody>
            {budgetReport.map((b) => (
              <tr key={b.id}>
                <td>{b.name}</td><td>{b.analytic_account_name}</td><td>{b.responsible_person}</td>
                <td>{money(b.planned)}</td><td>{money(b.actual)}</td><td>{money(b.variance)}</td>
                <td>{Number(b.utilization_percent).toFixed(1)}%</td>
              </tr>
            ))}
            {budgetReport.length === 0 && <tr><td colSpan={7} className="empty">No data.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Account Balances</h3>
        <table className="table">
          <thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
          <tbody>
            {balances.map((a) => (
              <tr key={a.id}><td>{a.code}</td><td>{a.name}</td><td>{a.type}</td><td>{money(a.debit)}</td><td>{money(a.credit)}</td><td>{money(a.balance)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Stock Report</h3>
        <table className="table">
          <thead><tr><th>Product</th><th>Type</th><th>Category</th><th>Qty</th><th>Cost</th><th>Sales Price</th><th>Stock Value</th></tr></thead>
          <tbody>
            {stock.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td><td>{s.type}</td><td>{s.category || '—'}</td><td>{s.stock_quantity}</td>
                <td>{money(s.cost)}</td><td>{money(s.sales_price)}</td><td>{money(s.stock_value_at_cost)}</td>
              </tr>
            ))}
            {stock.length === 0 && <tr><td colSpan={7} className="empty">No products.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}