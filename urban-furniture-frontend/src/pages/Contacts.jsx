import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as api from '../api/endpoints';
import { apiErrorMessage } from '../utils/format';

const EMPTY_FORM = {
  name: '', type: 'Customer', email: '', mobile: '', city: '', state: '', pincode: '',
  create_portal_user: false, portal_password: '',
};

export default function Contacts() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [contacts, setContacts] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const load = () => api.listContacts(showArchived).then(setContacts);
  useEffect(() => { load(); }, [showArchived]);

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { create_portal_user, portal_password, ...payload } = form;
        await api.updateContact(editingId, payload);
        showToast('Contact updated.');
      } else {
        await api.createContact(form);
        showToast('Contact created.');
      }
      resetForm();
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setForm({ ...EMPTY_FORM, ...c });
  };

  const toggleArchive = async (c) => {
    try {
      await api.archiveContact(c.id, !c.is_active);
      showToast(c.is_active ? 'Contact archived.' : 'Contact restored.');
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  };

  const uploadImage = async (c, file) => {
    try {
      await api.uploadContactImage(c.id, file);
      showToast('Profile image updated.');
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Contacts Master</h2>
        <label className="checkbox-inline">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Show archived
        </label>
      </div>

      <div className="card">
        <h3>{editingId ? 'Edit Contact' : 'New Contact'}</h3>
        <form className="form-grid" onSubmit={submit}>
          <input placeholder="Full name / Company" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="Customer">Customer</option>
            <option value="Vendor">Vendor</option>
            <option value="Both">Both</option>
          </select>
          <input type="email" placeholder="Email" value={form.email || ''}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Mobile" value={form.mobile || ''}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          <input placeholder="City" value={form.city || ''}
            onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input placeholder="State" value={form.state || ''}
            onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <input placeholder="Pincode" value={form.pincode || ''}
            onChange={(e) => setForm({ ...form, pincode: e.target.value })} />

          {!editingId && (
            <>
              <label className="checkbox-inline">
                <input type="checkbox" checked={form.create_portal_user}
                  onChange={(e) => setForm({ ...form, create_portal_user: e.target.checked })} />
                Create portal login for this contact
              </label>
              {form.create_portal_user && (
                <input type="password" placeholder="Portal password (min 8 chars)" value={form.portal_password}
                  onChange={(e) => setForm({ ...form, portal_password: e.target.value })} />
              )}
            </>
          )}

          <div className="form-actions">
            <button className="btn btn-primary" type="submit">{editingId ? 'Save changes' : 'Save contact'}</button>
            {editingId && <button className="btn btn-ghost" type="button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Type</th><th>Email</th><th>Mobile</th><th>Location</th><th>Photo</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.type}</td>
                <td>{c.email || '—'}</td>
                <td>{c.mobile || '—'}</td>
                <td>{[c.city, c.state, c.pincode].filter(Boolean).join(', ') || '—'}</td>
                <td>
                  {c.profile_image_url && <img className="avatar" src={`${import.meta.env.VITE_API_BASE_URL}${c.profile_image_url}`} alt="" />}
                  <label className="btn btn-tiny">
                    Upload
                    <input type="file" accept="image/*" hidden
                      onChange={(e) => e.target.files[0] && uploadImage(c, e.target.files[0])} />
                  </label>
                </td>
                <td><span className={`badge ${c.is_active ? 'badge-success' : 'badge-muted'}`}>{c.is_active ? 'Active' : 'Archived'}</span></td>
                <td className="row-actions">
                  {isAdmin && <button className="btn btn-tiny" onClick={() => startEdit(c)}>Edit</button>}
                  {isAdmin && (
                    <button className="btn btn-tiny btn-danger" onClick={() => toggleArchive(c)}>
                      {c.is_active ? 'Archive' : 'Restore'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {contacts.length === 0 && <tr><td colSpan={8} className="empty">No contacts yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}