import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as api from '../api/endpoints';
import { apiErrorMessage } from '../utils/format';

const EMPTY_FORM = { name: '', type: 'Expense' };

export default function Analytics() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const load = () => api.listAnalytics().then(setItems);
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) { await api.updateAnalytic(editingId, form); showToast('Analytic account updated.'); }
      else { await api.createAnalytic(form); showToast('Analytic account created.'); }
      resetForm(); load();
    } catch (err) { showToast(apiErrorMessage(err), 'error'); }
  };

  const toggleArchive = async (a) => {
    try { await api.archiveAnalytic(a.id, !a.is_active); load(); }
    catch (err) { showToast(apiErrorMessage(err), 'error'); }
  };

  return (
    <div>
      <div className="page-header"><h2>Analytic Accounts</h2></div>
      <div className="card">
        <h3>{editingId ? 'Edit' : 'New'} Analytic Account</h3>
        <form className="form-grid" onSubmit={submit}>
          <input placeholder="Department / Project name" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="Expense">Expense</option>
            <option value="Income">Income</option>
          </select>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">{editingId ? 'Save changes' : 'Save'}</button>
            {editingId && <button className="btn btn-ghost" type="button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Name</th><th>Type</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.type}</td>
                <td><span className={`badge ${a.is_active ? 'badge-success' : 'badge-muted'}`}>{a.is_active ? 'Active' : 'Archived'}</span></td>
                <td className="row-actions">
                  {isAdmin && <button className="btn btn-tiny" onClick={() => { setEditingId(a.id); setForm({ name: a.name, type: a.type }); }}>Edit</button>}
                  {isAdmin && <button className="btn btn-tiny btn-danger" onClick={() => toggleArchive(a)}>{a.is_active ? 'Archive' : 'Restore'}</button>}
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="empty">None yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}