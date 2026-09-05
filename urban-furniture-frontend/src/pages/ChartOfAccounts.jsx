import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as api from '../api/endpoints';
import { apiErrorMessage } from '../utils/format';

const EMPTY_FORM = { code: '', name: '', type: 'Asset' };

export default function ChartOfAccounts() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const load = () => api.listAccounts(showArchived).then(setAccounts);
  useEffect(() => { load(); }, [showArchived]);

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateAccount(editingId, { name: form.name, type: form.type });
        showToast('Account updated.');
      } else {
        await api.createAccount(form);
        showToast('Account created.');
      }
      resetForm();
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  };

  const startEdit = (a) => { setEditingId(a.id); setForm({ ...a }); };

  const toggleArchive = async (a) => {
    try {
      await api.archiveAccount(a.id, !a.is_active);
      showToast(a.is_active ? 'Account archived.' : 'Account restored.');
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Chart of Accounts</h2>
        <label className="checkbox-inline">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Show archived
        </label>
      </div>

      <div className="card">
        <h3>{editingId ? 'Edit Account' : 'New Account'}</h3>
        <form className="form-grid" onSubmit={submit}>
          <input placeholder="Code (e.g. 1005)" required disabled={!!editingId} value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <input placeholder="Account name" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="Asset">Asset</option>
            <option value="Liability">Liability</option>
            <option value="Equity">Equity</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">{editingId ? 'Save changes' : 'Save account'}</button>
            {editingId && <button className="btn btn-ghost" type="button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td>{a.code}</td>
                <td>{a.name}</td>
                <td>{a.type}</td>
                <td><span className={`badge ${a.is_active ? 'badge-success' : 'badge-muted'}`}>{a.is_active ? 'Active' : 'Archived'}</span></td>
                <td className="row-actions">
                  {isAdmin && <button className="btn btn-tiny" onClick={() => startEdit(a)}>Edit</button>}
                  {isAdmin && (
                    <button className="btn btn-tiny btn-danger" onClick={() => toggleArchive(a)}>
                      {a.is_active ? 'Archive' : 'Restore'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {accounts.length === 0 && <tr><td colSpan={5} className="empty">No accounts yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}