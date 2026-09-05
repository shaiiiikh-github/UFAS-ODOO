import React, { useEffect, useState } from 'react';
import * as api from '../api/endpoints';
import { money, dateStr } from '../utils/format';

export default function JournalEntries() {
  const [entries, setEntries] = useState([]);
  const [openId, setOpenId] = useState(null);

  useEffect(() => { api.listJournalEntries().then(setEntries); }, []);

  return (
    <div>
      <div className="page-header"><h2>Journal Entries (Audit Trail)</h2></div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Date</th><th>Reference</th><th>Journal</th><th>Debit</th><th>Credit</th><th>Balanced</th><th></th></tr></thead>
          <tbody>
            {entries.map((e) => (
              <React.Fragment key={e.id}>
                <tr>
                  <td>{dateStr(e.date)}</td>
                  <td>{e.reference}</td>
                  <td>{e.journal_name || '—'}</td>
                  <td>{money(e.total_debit)}</td>
                  <td>{money(e.total_credit)}</td>
                  <td><span className={`badge ${e.balanced ? 'badge-success' : 'badge-error'}`}>{e.balanced ? 'Yes' : 'No'}</span></td>
                  <td><button className="btn btn-tiny" onClick={() => setOpenId(openId === e.id ? null : e.id)}>{openId === e.id ? 'Hide' : 'Items'}</button></td>
                </tr>
                {openId === e.id && (
                  <tr>
                    <td colSpan={7}>
                      <table className="table table-compact table-nested">
                        <thead><tr><th>Account</th><th>Type</th><th>Debit</th><th>Credit</th></tr></thead>
                        <tbody>
                          {e.items.map((it) => (
                            <tr key={it.id}>
                              <td>{it.account_code} · {it.account_name}</td>
                              <td>{it.account_type}</td>
                              <td>{it.debit > 0 ? money(it.debit) : ''}</td>
                              <td>{it.credit > 0 ? money(it.credit) : ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {entries.length === 0 && <tr><td colSpan={7} className="empty">No journal entries posted yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}