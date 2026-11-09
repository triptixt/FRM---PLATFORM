'use client';

import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { blacklistAPI } from '@/services/api';
import type { BlacklistEntry, BlacklistStat } from '@/types';
import { RefreshCw, Plus, Trash2, X, ShieldOff, Eye } from 'lucide-react';

const ENTITY_TYPES = ['MOBILE', 'CARD_TOKEN', 'EMAIL', 'IP', 'DEVICE', 'VPA'];
const RISK_LEVELS = ['HIGH', 'MEDIUM', 'LOW'];
const SOURCES = ['INTERNAL', 'BANK', 'REGULATOR', 'AUTO'];

const fmt = (dt?: string | null) =>
  dt
    ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Permanent';

const riskColor: Record<string, string> = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' };
const listColor: Record<string, string> = { BLACKLIST: '#ef4444', WATCHLIST: '#f59e0b' };

function AddModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    entityType: 'MOBILE',
    entityValue: '',
    listType: 'BLACKLIST',
    riskLevel: 'HIGH',
    source: 'INTERNAL',
    remarks: '',
    caseRef: '',
    expiryDays: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const save = async () => {
    if (!form.entityValue.trim()) {
      setError('Entity value is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await blacklistAPI.add({
        ...form,
        expiryDays: form.expiryDays ? parseInt(form.expiryDays) : null,
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to add entry');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );

  if (!mounted) return null;

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div className="card" style={{ width: 460, padding: 28 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 22,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
            Add to Blacklist / Watchlist
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 14,
              color: 'var(--red)',
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
          {field(
            'Entity Type',
            <select
              value={form.entityType}
              onChange={(e) => setForm((f) => ({ ...f, entityType: e.target.value }))}
              style={{ width: '100%' }}
            >
              {ENTITY_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          )}
          {field(
            'List Type',
            <select
              value={form.listType}
              onChange={(e) => setForm((f) => ({ ...f, listType: e.target.value }))}
              style={{ width: '100%' }}
            >
              <option value="BLACKLIST">Blacklist (Block)</option>
              <option value="WATCHLIST">Watchlist (Monitor)</option>
            </select>
          )}
        </div>

        {field(
          'Value (Mobile / IP / Card Token / Device ID etc.)',
          <input
            value={form.entityValue}
            onChange={(e) => setForm((f) => ({ ...f, entityValue: e.target.value }))}
            placeholder={
              form.entityType === 'MOBILE'
                ? '9876543210'
                : form.entityType === 'IP'
                ? '192.168.1.1'
                : 'Enter value...'
            }
            style={{ width: '100%' }}
            autoFocus
          />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
          {field(
            'Risk Level',
            <select
              value={form.riskLevel}
              onChange={(e) => setForm((f) => ({ ...f, riskLevel: e.target.value }))}
              style={{ width: '100%' }}
            >
              {RISK_LEVELS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          )}
          {field(
            'Source',
            <select
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              style={{ width: '100%' }}
            >
              {SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
          {field(
            'Case Reference (optional)',
            <input
              value={form.caseRef}
              onChange={(e) => setForm((f) => ({ ...f, caseRef: e.target.value }))}
              placeholder="CASE-2026-000001"
              style={{ width: '100%' }}
            />
          )}
          {field(
            'Expiry (days, blank = permanent)',
            <input
              type="number"
              min="1"
              value={form.expiryDays}
              onChange={(e) => setForm((f) => ({ ...f, expiryDays: e.target.value }))}
              placeholder="e.g. 30"
              style={{ width: '100%' }}
            />
          )}
        </div>

        {field(
          'Remarks / Reason',
          <textarea
            value={form.remarks}
            onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
            placeholder="Why is this being added?"
            rows={2}
            style={{ width: '100%', resize: 'vertical' }}
          />
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Adding...' : 'Add Entry'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Blacklist() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [stats, setStats] = useState<BlacklistStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [listType, setListType] = useState('BLACKLIST');
  const [entityType, setEntityType] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [entriesRes, statsRes] = await Promise.all([
        blacklistAPI.list({
          listType,
          entityType: entityType || undefined,
          size: 100,
        }),
        blacklistAPI.stats(),
      ]);
      setEntries(entriesRes.data.data || []);
      setStats(statsRes.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [listType, entityType]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: number) => {
    if (!window.confirm('Remove this entry from the list?')) return;
    setRemoving(id);
    try {
      await blacklistAPI.delete(id);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setRemoving(null);
    }
  };

  // Stats grouped by entityType for current listType
  const statsByType = ENTITY_TYPES.reduce((acc: Record<string, number>, t: string) => {
    const s = stats.find((x) => x.entity_type === t && x.list_type === listType);
    acc[t] = s ? Number(s.count) : 0;
    return acc;
  }, {});

  return (
    <div style={{ padding: 32 }} className="fade-in">
      {adding && <AddModal onClose={() => setAdding(false)} onSaved={load} />}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}
          >
            Blacklist / Watchlist
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 2 }}>
            Manage blocked and monitored entities
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={load} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'pulse' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setAdding(true)}>
            <Plus size={14} /> Add Entry
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6,1fr)',
          gap: 10,
          marginBottom: 24,
        }}
      >
        {ENTITY_TYPES.map((t) => (
          <div
            key={t}
            className="card"
            style={{
              padding: '12px 14px',
              cursor: 'pointer',
              borderColor: entityType === t ? 'var(--accent)' : undefined,
            }}
            onClick={() => setEntityType(entityType === t ? '' : t)}
          >
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>
              {statsByType[t]}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid var(--border)',
          }}
        >
          {['BLACKLIST', 'WATCHLIST'].map((l) => (
            <button
              key={l}
              onClick={() => {
                setListType(l);
                setEntityType('');
              }}
              style={{
                padding: '7px 16px',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                background:
                  listType === l
                    ? l === 'BLACKLIST'
                      ? 'rgba(239,68,68,0.15)'
                      : 'rgba(245,158,11,0.15)'
                    : 'var(--bg2)',
                color: listType === l ? listColor[l] : 'var(--text2)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {l === 'BLACKLIST' ? (
                <>
                  <ShieldOff size={12} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                </>
              ) : (
                <>
                  <Eye size={12} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                </>
              )}
              {l}
            </button>
          ))}
        </div>
        {entityType && (
          <button
            className="btn"
            onClick={() => setEntityType('')}
            style={{ color: 'var(--accent)', fontSize: 12 }}
          >
            <X size={12} /> Clear filter: {entityType}
          </button>
        )}
        <span style={{ fontSize: 12, color: 'var(--text3)', alignSelf: 'center', marginLeft: 4 }}>
          {entries.length} entries
        </span>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Loading...</div>
        ) : entries.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
            <ShieldOff size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div>
              No {listType.toLowerCase()} entries{entityType ? ` for ${entityType}` : ''}
            </div>
            <div style={{ fontSize: 12, marginTop: 6 }}>
              Click &quot;Add Entry&quot; to block or monitor an entity
            </div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Value</th>
                <th>Risk</th>
                <th>Source</th>
                <th>Case Ref</th>
                <th>Remarks</th>
                <th>Expiry</th>
                <th>Added By</th>
                <th>Added On</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: `${riskColor[e.risk_level]}10`,
                        color: riskColor[e.risk_level],
                        border: `1px solid ${riskColor[e.risk_level]}30`,
                      }}
                    >
                      {e.entity_type}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)' }}>
                    {e.entity_value}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: 11,
                        color: riskColor[e.risk_level],
                        fontWeight: 500,
                      }}
                    >
                      {e.risk_level}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text2)' }}>{e.source}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>
                    {e.case_ref || '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text2)', maxWidth: 200 }}>
                    <div
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {e.remarks || '—'}
                    </div>
                  </td>
                  <td
                    style={{
                      fontSize: 12,
                      color: e.expiry_date ? 'var(--amber)' : 'var(--text3)',
                    }}
                  >
                    {e.expiry_date ? fmt(e.expiry_date) : 'Permanent'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text2)' }}>{e.created_by}</td>
                  <td style={{ fontSize: 12 }}>{fmt(e.created_at)}</td>
                  <td>
                    <button
                      onClick={() => remove(e.id)}
                      disabled={removing === e.id}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--red)',
                        padding: 4,
                        opacity: removing === e.id ? 0.4 : 1,
                      }}
                      title="Remove entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
