import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import * as api from '../api/endpoints';
import Modal from '../components/Modal';
import { money, dateStr, apiErrorMessage } from '../utils/format';

export default function MyInvoices() {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [journals, setJournals] = useState([]);
  const [payTarget, setPayTarget] = useState(null);
  const [payForm, setPayForm] = useState({ journal_id: '', amount: 0, reference: '' });

  const load = () => {
    api.listDocuments().then(setDocuments); // backend already filters to this contact's own docs
    api.listJournals().then((all) => setJournals(all.filter((j) => j.type === 'Bank' || j.type === 'Cash')));
  };
  useEffect(() => { load(); }, []);

  const openPay = (doc) => {
    setPayTarget(doc);
    setPayForm({ journal_id: '', amount: Number(doc.outstanding_amount), reference: '' });
  };

  const payOnline = async (doc) => {
    if (!window.Razorpay) return showToast('Payment gateway failed to load. Check your connection.', 'error');
    try {
      const order = await api.createRazorpayOrder(doc.id);
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: 'Urban Furniture',
        description: `Payment for ${doc.type}`,
        handler: async (response) => {
          try {
            const result = await api.verifyRazorpayPayment({
              document_id: doc.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            showToast(`Payment ${money(result.payment_amount)} received.`);
            load();
          } catch (err) {
            showToast(apiErrorMessage(err), 'error');
          }
        },
        modal: { ondismiss: () => showToast('Payment cancelled.', 'error') },
      });
      rzp.open();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
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
      showToast(`Payment ${money(result.payment_amount)} submitted.`);
      setPayTarget(null);
      load();
    } catch (err) {
      showToast(apiErrorMessage(err), 'error');
    }
  };

  return (
    <div>
      <div className="page-header"><h2>My Invoices &amp; Bills</h2></div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Date</th><th>Type</th><th>Status</th><th>Total</th><th>Outstanding</th><th></th></tr></thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id}>
                <td>{dateStr(d.date)}</td>
                <td>{d.type}</td>
                <td><span className="badge">{d.status}</span></td>
                <td>{money(d.total)}</td>
                <td>{money(d.outstanding_amount)}</td>
                <td>
                  {['Confirmed', 'Partially Paid'].includes(d.status) && (
                    <>
                      <button className="btn btn-tiny btn-success" onClick={() => payOnline(d)}>Pay Online</button>{' '}
                      <button className="btn btn-tiny" onClick={() => openPay(d)}>Record Manually</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {documents.length === 0 && <tr><td colSpan={6} className="empty">Nothing to show yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {payTarget && (
        <Modal title={`Pay ${payTarget.type}`} onClose={() => setPayTarget(null)}>
          <div className="kv-list">
            <div><span>Total</span><b>{money(payTarget.total)}</b></div>
            <div><span>Outstanding</span><b>{money(payTarget.outstanding_amount)}</b></div>
          </div>
          <label>Amount</label>
          <input type="number" min="0.01" step="0.01" max={payTarget.outstanding_amount}
            value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
          <label>Pay via</label>
          <select value={payForm.journal_id} onChange={(e) => setPayForm({ ...payForm, journal_id: e.target.value })}>
            <option value="">-- Select Bank or Cash --</option>
            {journals.map((j) => <option key={j.id} value={j.id}>{j.name} ({j.type})</option>)}
          </select>
          <label>Reference (optional)</label>
          <input value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} />
          <div className="form-actions">
            <button className="btn btn-primary btn-block" onClick={submitPayment}>Submit Payment</button>
          </div>
        </Modal>
      )}
    </div>
  );
}