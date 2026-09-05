import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as api from '../api/endpoints';
import { money, dateStr, apiErrorMessage } from '../utils/format';

const EMPTY_FORM = { name: '', analytic_account_id: '', planned_amount: '', period_start: '', period_end: '', responsible_person: '' };

export default function Budgets() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [budgets, setBudgets] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    api.listBudgets().then(setBudgets);
    api.listAnalytics().then(setAnalytics);
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, planned_amount: Number(form.planned_amount) };
      if (editingId) { await api.updateBudget(editingId, payload); showToast('Budget updated.'); }
      else { await api.createBudget(payload); showToast('Budget allocated.'); }
      resetForm(); load();
    } catch (err) { showToast(apiErrorMessage(err), 'error'); }
  };

  const toggleArchive = async (b) => {
    try { await api.archiveBudget(b.id, !b.is_active); load(); }
    catch (err) { showToast(apiErrorMessage(err), 'error'); }
  };

  return (
    <div>
      <div className="page-header"><h2>Budgets</h2></div>
      <div className="card">
        <h3>{editingId ? 'Edit' : 'Allocate'} Budget</h3>
        <form className="form-grid" onSubmit={submit}>
          <input placeholder="Budget name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select required value={form.analytic_account_id} onChange={(e) => setForm({ ...form, analytic_account_id: e.target.value })}>
            <option value="">-- Analytic Account --</option>
            {analytics.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <input type="number" step="0.01" min="0" placeholder="Planned amount (₹)" required value={form.planned_amount}
            onChange={(e) => setForm({ ...form, planned_amount: e.target.value })} />
          <input type="date" required value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} />
          <input type="date" required value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} />
          <input placeholder="Responsible person" required value={form.responsible_person}
            onChange={(e) => setForm({ ...form, responsible_person: e.target.value })} />
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">{editingId ? 'Save changes' : 'Define budget'}</button>
            {editingId && <button className="btn btn-ghost" type="button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Name</th><th>Analytic Acct</th><th>Period</th><th>Responsible</th><th>Planned</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {budgets.map((b) => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{analytics.find((a) => a.id === b.analytic_account_id)?.name || '—'}</td>
                <td>{dateStr(b.period_start)} → {dateStr(b.period_end)}</td>
                <td>{b.responsible_person}</td>
                <td>{money(b.planned_amount)}</td>
                <td><span className={`badge ${b.is_active ? 'badge-success' : 'badge-muted'}`}>{b.is_active ? 'Active' : 'Archived'}</span></td>
                <td className="row-actions">
                  {isAdmin && <button className="btn btn-tiny" onClick={() => { setEditingId(b.id); setForm({ ...b, planned_amount: b.planned_amount }); }}>Edit</button>}
                  {isAdmin && <button className="btn btn-tiny btn-danger" onClick={() => toggleArchive(b)}>{b.is_active ? 'Archive' : 'Restore'}</button>}
                </td>
              </tr>
            ))}
            {budgets.length === 0 && <tr><td colSpan={7} className="empty">No budgets yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}