import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import * as api from '../api/endpoints';
import { apiErrorMessage } from '../utils/format';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'Accountant' };

export default function Users() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () => api.listStaffUsers().then(setUsers);
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.createStaffUser(form);
      showToast('User created.');
      setForm(EMPTY_FORM);
      load();
    } catch (err) { showToast(apiErrorMessage(err), 'error'); }
  };

  return (
    <div>
      <div className="page-header"><h2>Staff Users</h2></div>
      <div className="card">
        <h3>Create Admin / Accountant login</h3>
        <form className="form-grid" onSubmit={submit}>
          <input placeholder="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input type="password" placeholder="Password (min 8 chars)" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="Accountant">Accountant (Invoicing User)</option>
            <option value="Admin">Admin (Business Owner)</option>
          </select>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">Create user</button>
          </div>
        </form>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td><td>{u.email}</td><td>{u.role}</td>
                <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-muted'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={4} className="empty">No staff users yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}