'use client';

import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { casesAPI } from '@/services/api';
import type { FraudCase, CaseAuditLog, PageResponse } from '@/types';
import { RefreshCw, ChevronLeft, ChevronRight, X, Clock, Edit2 } from 'lucide-react';

const fmt = (dt?: string | null) =>
  dt ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const fmtDate = (dt?: string | null) =>
  dt ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const decisionBadge = (d?: string | null) => {
  const map: Record<string, string> = { ALLOW: 'allow', REVIEW: 'review', BLOCK: 'block' };
  return <span className={`badge badge-${map[d || ''] || 'allow'}`}>{d}</span>;
};
const statusBadge = (s?: string | null) => (
  <span className={`badge badge-${s?.toLowerCase()}`}>{s}</span>
);

// ── Audit Timeline Modal ──────────────────────────────────────────────────────
function AuditModal({ caseItem, onClose }: { caseItem: FraudCase; onClose: () => void }) {
  const [logs, setLogs] = useState<CaseAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    casesAPI
      .audit(caseItem.caseId)
      .then((r) => setLogs(r.data.data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [caseItem.caseId]);

  if (!mounted) return null;

  return ReactDOM.createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11,42,91,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          width: 520,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(11,42,91,0.2)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '18px 24px 14px',
            borderBottom: '1px solid #DDE3EF',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0B2A5B' }}>Audit History</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#1E88E5', marginTop: 2 }}>
                {caseItem.caseRef}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ overflow: 'auto', padding: '20px 24px', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 32 }}>Loading audit trail...</div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 32 }}>No audit records found</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {logs.map((log, i) => (
                <div key={log.id} style={{ display: 'flex', gap: 14 }}>
                  {/* Timeline line */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      width: 16,
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: i === 0 ? '#1E88E5' : '#DDE3EF',
                        border: `2px solid ${i === 0 ? '#1E88E5' : '#9CA3AF'}`,
                        flexShrink: 0,
                        marginTop: 3,
                      }}
                    />
                    {i < logs.length - 1 && (
                      <div style={{ width: 2, flex: 1, background: '#DDE3EF', minHeight: 24, marginTop: 2 }} />
                    )}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, paddingBottom: 20 }}>
                    {/* Status change */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      {log.old_status && (
                        <>
                          <span
                            className={`badge badge-${log.old_status?.toLowerCase()}`}
                            style={{ fontSize: 10 }}
                          >
                            {log.old_status}
                          </span>
                          <span style={{ color: '#9CA3AF', fontSize: 12 }}>→</span>
                        </>
                      )}
                      <span
                        className={`badge badge-${log.new_status?.toLowerCase()}`}
                        style={{ fontSize: 10 }}
                      >
                        {log.new_status}
                      </span>
                    </div>
                    {/* Who + when */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 12,
                        fontSize: 11,
                        color: '#9CA3AF',
                        marginBottom: log.remarks ? 6 : 0,
                      }}
                    >
                      <span>
                        Updated by <strong style={{ color: '#1E88E5' }}>{log.changed_by || 'system'}</strong>
                      </span>
                      {log.assigned_to && (
                        <span>
                          Assigned to <strong style={{ color: '#374151' }}>{log.assigned_to}</strong>
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={10} />
                        {fmt(log.changed_at)}
                      </span>
                    </div>
                    {/* Remarks */}
                    {log.remarks && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#374151',
                          background: '#F5F7FA',
                          padding: '7px 10px',
                          borderRadius: 6,
                          borderLeft: '3px solid #1E88E5',
                          marginTop: 4,
                        }}
                      >
                        {log.remarks}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Update Modal ──────────────────────────────────────────────────────────────
function UpdateModal({
  caseItem,
  onClose,
  onSaved,
}: {
  caseItem: FraudCase;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    caseStatus: caseItem.caseStatus,
    remarks: '',
    assignedTo: caseItem.assignedTo || '',
  });
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await casesAPI.update(caseItem.caseId, form);
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return ReactDOM.createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11,42,91,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          width: 440,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(11,42,91,0.2)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #DDE3EF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0B2A5B' }}>Update Case</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#1E88E5', marginTop: 2 }}>
                {caseItem.caseRef}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
              Status
            </label>
            <select
              value={form.caseStatus}
              onChange={(e) => setForm((f) => ({ ...f, caseStatus: e.target.value as any }))}
              style={{ width: '100%' }}
            >
              <option value="OPEN">Open</option>
              <option value="REVIEWING">Reviewing</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
              Assigned To
            </label>
            <input
              value={form.assignedTo}
              onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
              placeholder="analyst@company.com"
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: 6 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
              Remarks
            </label>
            <textarea
              value={form.remarks}
              onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
              placeholder="Add investigation notes for this update..."
              rows={3}
              style={{ width: '100%', resize: 'vertical', minHeight: 70 }}
            />
          </div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 18 }}>
            Each update is recorded in the audit history with timestamp and your username.
          </div>
        </div>

        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #DDE3EF',
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
            background: '#FAFBFE',
          }}
        >
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Update'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main Cases Page ───────────────────────────────────────────────────────────
export default function Cases() {
  const [data, setData] = useState<PageResponse<FraudCase>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 15,
    number: 0,
    first: true,
    last: true,
    empty: true,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('OPEN');
  const [editing, setEditing] = useState<FraudCase | null>(null);
  const [auditing, setAuditing] = useState<FraudCase | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await casesAPI.list({ page, size: 15, status });
      setData(
        res.data.data || {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: 15,
          number: 0,
          first: true,
          last: true,
          empty: true,
        }
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ padding: '24px 28px' }} className="fade-in">
      {editing && <UpdateModal caseItem={editing} onClose={() => setEditing(null)} onSaved={load} />}
      {auditing && <AuditModal caseItem={auditing} onClose={() => setAuditing(null)} />}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0B2A5B', letterSpacing: '-0.02em' }}>
            Fraud Cases
          </h1>
          <p style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>
            {data.totalElements} cases · click <strong>History</strong> to see who updated and when
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
            style={{ height: 34 }}
          >
            <option value="OPEN">Open</option>
            <option value="REVIEWING">Reviewing</option>
            <option value="CLOSED">Closed</option>
          </select>
          <button className="btn" onClick={load} disabled={loading} style={{ fontSize: 12 }}>
            <RefreshCw size={12} className={loading ? 'pulse' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading...</div>
        ) : data.content?.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>
            No {status.toLowerCase()} cases
          </div>
        ) : (
          <table style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th>Case Ref</th>
                <th>Txn ID</th>
                <th>Merchant</th>
                <th>Score</th>
                <th>Decision</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Last Updated</th>
                <th>Created</th>
                <th style={{ textAlign: 'center' }}>Update</th>
                <th style={{ textAlign: 'center' }}>History</th>
              </tr>
            </thead>
            <tbody>
              {data.content?.map((c) => (
                <tr key={c.caseId}>
                  <td
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      color: '#1E88E5',
                      fontWeight: 600,
                    }}
                  >
                    {c.caseRef}
                  </td>
                  <td
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      color: '#6B7280',
                      maxWidth: 120,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c.txnId}
                  </td>
                  <td style={{ fontSize: 11 }}>{c.merchantId}</td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--mono)',
                        fontWeight: 700,
                        color:
                          c.riskScore >= 70 ? '#DC2626' : c.riskScore >= 40 ? '#D97706' : '#16A34A',
                      }}
                    >
                      {c.riskScore}
                    </span>
                  </td>
                  <td>{decisionBadge(c.decision)}</td>
                  <td>{statusBadge(c.caseStatus)}</td>
                  <td style={{ fontSize: 11, color: '#374151' }}>
                    {c.assignedTo || <span style={{ color: '#9CA3AF' }}>Unassigned</span>}
                  </td>
                  {/* Last updated — shows when case was last changed */}
                  <td style={{ fontSize: 11, color: '#6B7280' }}>{fmtDate(c.updatedAt)}</td>
                  <td style={{ fontSize: 11, color: '#6B7280' }}>{fmtDate(c.createdAt)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn"
                      style={{ padding: '3px 10px', fontSize: 11, gap: 4 }}
                      onClick={() => setEditing(c)}
                    >
                      <Edit2 size={11} /> Update
                    </button>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#1E88E5',
                        padding: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: 11,
                      }}
                      onClick={() => setAuditing(c)}
                      title="View full audit history"
                    >
                      <Clock size={12} /> History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {data.totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderTop: '1px solid #DDE3EF',
            }}
          >
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>
              Page {page + 1} of {data.totalPages} · {data.totalElements} total
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                style={{ padding: '5px 10px' }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                className="btn"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages - 1}
                style={{ padding: '5px 10px' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
