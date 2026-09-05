import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as api from '../api/endpoints';
import { money, apiErrorMessage } from '../utils/format';

const EMPTY_FORM = { name: '', type: 'Goods', sales_price: '', cost: '', category: '', stock_quantity: 0 };

export default function Products() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const load = () => api.listProducts(showArchived).then(setProducts);
  useEffect(() => { load(); }, [showArchived]);

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, sales_price: Number(form.sales_price), cost: Number(form.cost), stock_quantity: Number(form.stock_quantity) };
      if (editingId) {
        await api.updateProduct(editingId, payload);
        showToast('Product updated.');
      } else {
        await api.createProduct(payload);
        showToast('Product created.');
      }
      resetForm();
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  };

  const startEdit = (p) => { setEditingId(p.id); setForm({ ...p }); };

  const toggleArchive = async (p) => {
    try {
      await api.archiveProduct(p.id, !p.is_active);
      showToast(p.is_active ? 'Product archived.' : 'Product restored.');
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Products &amp; Stock Master</h2>
        <label className="checkbox-inline">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Show archived
        </label>
      </div>

      <div className="card">
        <h3>{editingId ? 'Edit Product' : 'New Product'}</h3>
        <form className="form-grid" onSubmit={submit}>
          <input placeholder="Product name" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="Goods">Goods</option>
            <option value="Service">Service</option>
            <option value="Combo">Combo</option>
          </select>
          <input placeholder="Category" value={form.category || ''}
            onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input type="number" step="0.01" min="0" placeholder="Sales price (₹)" required value={form.sales_price}
            onChange={(e) => setForm({ ...form, sales_price: e.target.value })} />
          <input type="number" step="0.01" min="0" placeholder="Cost price (₹)" required value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          <input type="number" min="0" placeholder="Opening stock qty" value={form.stock_quantity}
            onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">{editingId ? 'Save changes' : 'Save product'}</button>
            {editingId && <button className="btn btn-ghost" type="button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>Name</th><th>Type</th><th>Category</th><th>Sales Price</th><th>Cost</th><th>Stock</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.type}</td>
                <td>{p.category || '—'}</td>
                <td>{money(p.sales_price)}</td>
                <td>{money(p.cost)}</td>
                <td>{p.stock_quantity}</td>
                <td><span className={`badge ${p.is_active ? 'badge-success' : 'badge-muted'}`}>{p.is_active ? 'Active' : 'Archived'}</span></td>
                <td className="row-actions">
                  {isAdmin && <button className="btn btn-tiny" onClick={() => startEdit(p)}>Edit</button>}
                  {isAdmin && (
                    <button className="btn btn-tiny btn-danger" onClick={() => toggleArchive(p)}>
                      {p.is_active ? 'Archive' : 'Restore'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={8} className="empty">No products yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}