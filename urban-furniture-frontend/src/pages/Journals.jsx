import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as api from '../api/endpoints';
import { apiErrorMessage } from '../utils/format';

const EMPTY_FORM = { name: '', type: 'Bank', default_account_id: '' };

export default function Journals() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    api.listJournals(showArchived).then(setJournals);
    api.listAccounts().then(setAccounts);
  };
  useEffect(() => { load(); }, [showArchived]);

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, default_account_id: form.default_account_id || null };
      if (editingId) {
        await api.updateJournal(editingId, payload);
        showToast('Journal updated.');
      } else {
        await api.createJournal(payload);
        showToast('Journal created.');
      }
      resetForm();
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  };

  const startEdit = (j) => { setEditingId(j.id); setForm({ name: j.name, type: j.type, default_account_id: j.default_account_id || '' }); };

  const toggleArchive = async (j) => {
    try {
      await api.archiveJournal(j.id, !j.is_active);
      showToast(j.is_active ? 'Journal archived.' : 'Journal restored.');
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Journals</h2>
        <label className="checkbox-inline">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Show archived
        </label>
      </div>

      <div className="card">
        <h3>{editingId ? 'Edit Journal' : 'New Journal'}</h3>
        <form className="form-grid" onSubmit={submit}>
          <input placeholder="Journal name (e.g. Main Bank)" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="Sales">Sales</option>
            <option value="Purchase">Purchase</option>
            <option value="Bank">Bank</option>
            <option value="Cash">Cash</option>
          </select>
          <select value={form.default_account_id} onChange={(e) => setForm({ ...form, default_account_id: e.target.value })}>
            <option value="">-- Default account (optional) --</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
          </select>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">{editingId ? 'Save changes' : 'Save journal'}</button>
            {editingId && <button className="btn btn-ghost" type="button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>Name</th><th>Type</th><th>Default Account</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {journals.map((j) => (
              <tr key={j.id}>
                <td>{j.name}</td>
                <td>{j.type}</td>
                <td>{j.default_account_name || '—'}</td>
                <td><span className={`badge ${j.is_active ? 'badge-success' : 'badge-muted'}`}>{j.is_active ? 'Active' : 'Archived'}</span></td>
                <td className="row-actions">
                  {isAdmin && <button className="btn btn-tiny" onClick={() => startEdit(j)}>Edit</button>}
                  {isAdmin && (
                    <button className="btn btn-tiny btn-danger" onClick={() => toggleArchive(j)}>
                      {j.is_active ? 'Archive' : 'Restore'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {journals.length === 0 && <tr><td colSpan={5} className="empty">No journals yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}