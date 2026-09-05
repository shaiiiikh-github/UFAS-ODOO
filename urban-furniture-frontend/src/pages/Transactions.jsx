import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import * as api from '../api/endpoints';
import Modal from '../components/Modal';
import { money, dateStr, apiErrorMessage } from '../utils/format';

const emptyLine = () => ({ product_id: '', quantity: 1, unit_price: '', tax_rate: 0, analytic_account_id: '' });

export default function Transactions() {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [journals, setJournals] = useState([]);

  const [docType, setDocType] = useState('Purchase Order');
  const [contactId, setContactId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState([emptyLine()]);

  const [payTarget, setPayTarget] = useState(null);
  const [payForm, setPayForm] = useState({ journal_id: '', amount: 0, reference: '' });

  const load = () => {
    api.listDocuments().then(setDocuments);
    api.listContacts().then(setContacts);
    api.listProducts().then(setProducts);
    api.listAnalytics().then(setAnalytics);
    api.listJournals().then((all) => setJournals(all.filter((j) => j.type === 'Bank' || j.type === 'Cash')));
  };
  useEffect(() => { load(); }, []);

  const relevantContacts = contacts.filter((c) =>
    docType === 'Purchase Order' ? (c.type === 'Vendor' || c.type === 'Both') : (c.type === 'Customer' || c.type === 'Both')
  );

  const updateLine = (idx, patch) => setLines(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const addLine = () => setLines([...lines, emptyLine()]);
  const removeLine = (idx) => setLines(lines.filter((_, i) => i !== idx));

  const createDoc = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        contact_id: contactId,
        type: docType,
        date,
        lines: lines.map((l) => ({
          product_id: l.product_id,
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
          tax_rate: Number(l.tax_rate || 0),
          analytic_account_id: l.analytic_account_id || null,
        })),
      };
      await api.createDocument(payload);
      showToast(`${docType} saved as draft.`);
      setContactId(''); setLines([emptyLine()]);
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  };

  const convert = async (id) => {
    try { await api.convertDocument(id); showToast('Converted successfully.'); load(); }
    catch (err) { showToast(apiErrorMessage(err), 'error'); }
  };

  const confirm = async (id) => {
    try { await api.confirmDocument(id); showToast('Posted to ledger and stock updated.'); load(); }
    catch (err) { showToast(apiErrorMessage(err), 'error'); }
  };

  const openPay = (doc) => {
    setPayTarget(doc);
    setPayForm({ journal_id: '', amount: Number(doc.outstanding_amount), reference: '' });
  };

  const submitPayment = async () => {
    if (!payForm.journal_id) return showToast('Select a Bank or Cash journal.', 'error');
    try {
      const result = await api.createPayment({
        document_id: payTarget.id,
        journal_id: payForm.journal_id,
        payment_date: new Date().toISOString().split('T')[0],
        amount: Number(payForm.amount).toFixed(2),
        reference: payForm.reference || null,
      });
      showToast(`Payment ${money(result.payment_amount)} posted. Status: ${result.document_status}.`);
      setPayTarget(null);
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  };

  return (
    <div>
      <div className="page-header"><h2>Transactions</h2></div>

      <div className="card">
        <h3>Create Purchase Order / Sales Order</h3>
        <form onSubmit={createDoc}>
          <div className="form-grid">
            <select value={docType} onChange={(e) => { setDocType(e.target.value); setContactId(''); }}>
              <option value="Purchase Order">Purchase Order</option>
              <option value="Sales Order">Sales Order</option>
            </select>
            <select required value={contactId} onChange={(e) => setContactId(e.target.value)}>
              <option value="">-- Select {docType === 'Purchase Order' ? 'Vendor' : 'Customer'} --</option>
              {relevantContacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <table className="table table-compact" style={{ marginTop: 12 }}>
            <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Tax %</th><th>Analytic Account</th><th></th></tr></thead>
            <tbody>
              {lines.map((l, idx) => (
                <tr key={idx}>
                  <td>
                    <select required value={l.product_id} onChange={(e) => updateLine(idx, { product_id: e.target.value })}>
                      <option value="">-- Product --</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity})</option>)}
                    </select>
                  </td>
                  <td><input type="number" min="1" required value={l.quantity} onChange={(e) => updateLine(idx, { quantity: e.target.value })} style={{ width: 70 }} /></td>
                  <td><input type="number" step="0.01" min="0" required value={l.unit_price} onChange={(e) => updateLine(idx, { unit_price: e.target.value })} style={{ width: 100 }} /></td>
                  <td><input type="number" step="0.01" min="0" max="100" value={l.tax_rate} onChange={(e) => updateLine(idx, { tax_rate: e.target.value })} style={{ width: 70 }} /></td>
                  <td>
                    <select value={l.analytic_account_id} onChange={(e) => updateLine(idx, { analytic_account_id: e.target.value })}>
                      <option value="">Optional</option>
                      {analytics.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </td>
                  <td>{lines.length > 1 && <button type="button" className="btn btn-tiny btn-danger" onClick={() => removeLine(idx)}>✕</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={addLine}>+ Add line</button>
            <button type="submit" className="btn btn-primary">Save as Draft</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Transaction Lifecycle</h3>
        <table className="table">
          <thead><tr><th>Date</th><th>Type</th><th>Partner</th><th>Status</th><th>Total</th><th>Outstanding</th><th></th></tr></thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id}>
                <td>{dateStr(d.date)}</td>
                <td>{d.type}</td>
                <td>{d.contact_name}</td>
                <td><span className="badge">{d.status}</span></td>
                <td>{money(d.total)}</td>
                <td>{money(d.outstanding_amount)}</td>
                <td className="row-actions">
                  {(d.type === 'Purchase Order' || d.type === 'Sales Order') && d.status === 'Draft' && (
                    <button className="btn btn-tiny" onClick={() => convert(d.id)}>Convert to Bill/Invoice</button>
                  )}
                  {(d.type === 'Vendor Bill' || d.type === 'Customer Invoice') && d.status === 'Draft' && (
                    <button className="btn btn-tiny" onClick={() => confirm(d.id)}>Post to Ledger</button>
                  )}
                  {(d.type === 'Vendor Bill' || d.type === 'Customer Invoice') && ['Confirmed', 'Partially Paid'].includes(d.status) && (
                    <button className="btn btn-tiny btn-success" onClick={() => openPay(d)}>Register Payment</button>
                  )}
                </td>
              </tr>
            ))}
            {documents.length === 0 && <tr><td colSpan={7} className="empty">No documents yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {payTarget && (
        <Modal title={`Register Payment · ${payTarget.type}`} onClose={() => setPayTarget(null)}>
          <div className="kv-list">
            <div><span>Total</span><b>{money(payTarget.total)}</b></div>
            <div><span>Outstanding</span><b>{money(payTarget.outstanding_amount)}</b></div>
          </div>
          <label>Amount</label>
          <input type="number" min="0.01" step="0.01" max={payTarget.outstanding_amount}
            value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
          <label>Journal (Bank / Cash)</label>
          <select value={payForm.journal_id} onChange={(e) => setPayForm({ ...payForm, journal_id: e.target.value })}>
            <option value="">-- Select --</option>
            {journals.map((j) => <option key={j.id} value={j.id}>{j.name} ({j.type})</option>)}
          </select>
          <label>Reference (optional)</label>
          <input value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} />
          <div className="form-actions">
            <button className="btn btn-primary btn-block" onClick={submitPayment}>Confirm Payment</button>
          </div>
        </Modal>
      )}
    </div>
  );
}