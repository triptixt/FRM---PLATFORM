'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { transactionsAPI } from '@/services/api';
import type { Transaction, PageResponse } from '@/types';
import { RefreshCw, ChevronLeft, ChevronRight, Search, X, Filter } from 'lucide-react';

const MODES = ['UPI', 'CARD', 'NETBANKING', 'WALLET', 'BNPL', 'EMI'];

const decisionBadge = (d?: string | null) => {
  const map: Record<string, string> = { ALLOW: 'allow', REVIEW: 'review', BLOCK: 'block' };
  return <span className={`badge badge-${map[d || ''] || 'allow'}`}>{d}</span>;
};

const fmtAmount = (n?: number | null) =>
  n != null
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(n)
    : '—';

const fmt = (dt?: string | null) =>
  dt
    ? new Date(dt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

interface FilterState {
  txnId: string;
  merchantId: string;
  decision: string;
  paymentMode: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: FilterState = {
  txnId: '',
  merchantId: '',
  decision: '',
  paymentMode: '',
  dateFrom: '',
  dateTo: '',
};

export default function Transactions() {
  const [data, setData] = useState<PageResponse<Transaction>>({
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
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<FilterState>(EMPTY_FILTERS); // committed filters
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = Object.values(applied).filter((v) => v !== '').length;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, size: 15 };
      if (applied.txnId) params.txnId = applied.txnId;
      if (applied.merchantId) params.merchantId = applied.merchantId;
      if (applied.decision) params.decision = applied.decision;
      if (applied.paymentMode) params.paymentMode = applied.paymentMode;
      if (applied.dateFrom) params.dateFrom = applied.dateFrom;
      if (applied.dateTo) params.dateTo = applied.dateTo;
      const res = await transactionsAPI.list(params);
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
  }, [page, applied]);

  useEffect(() => {
    load();
  }, [load]);

  const applyFilters = () => {
    setApplied({ ...filters });
    setPage(0);
    setShowFilters(false);
  };
  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(0);
  };

  const FilterInput = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 600,
          color: '#6B7280',
          marginBottom: 5,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <div style={{ padding: 32 }} className="fade-in">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#0B2A5B',
              letterSpacing: '-0.02em',
            }}
          >
            Transactions
          </h1>
          <p style={{ color: '#6B7280', fontSize: 13, marginTop: 3 }}>
            {data.totalElements} screened
            {activeFilterCount > 0 && (
              <span style={{ color: '#1E88E5', marginLeft: 6 }}>
                · {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={load} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'pulse' : ''} /> Refresh
          </button>
          <button
            className="btn"
            onClick={() => setShowFilters((s) => !s)}
            style={{
              color: activeFilterCount > 0 ? '#1E88E5' : undefined,
              borderColor: activeFilterCount > 0 ? '#BAD8FB' : undefined,
              background: activeFilterCount > 0 ? '#EAF3FF' : undefined,
            }}
          >
            <Filter size={13} />
            Filters
            {activeFilterCount > 0 && (
              <span
                style={{
                  background: '#1E88E5',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 20,
                  padding: '1px 6px',
                  marginLeft: 2,
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              className="btn"
              onClick={clearFilters}
              style={{ color: '#DC2626', borderColor: '#FECACA' }}
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div
          style={{
            background: 'white',
            border: '1px solid #DDE3EF',
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
            boxShadow: '0 2px 8px rgba(11,42,91,0.07)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '14px 20px',
              marginBottom: 16,
            }}
          >
            <FilterInput label="Transaction ID">
              <input
                value={filters.txnId}
                placeholder="e.g. TXN-2026-001"
                onChange={(e) => setFilters((f) => ({ ...f, txnId: e.target.value }))}
                style={{ width: '100%' }}
              />
            </FilterInput>

            <FilterInput label="Merchant ID">
              <input
                value={filters.merchantId}
                placeholder="e.g. MID-001"
                onChange={(e) =>
                  setFilters((f) => ({ ...f, merchantId: e.target.value }))
                }
                style={{ width: '100%' }}
              />
            </FilterInput>

            <FilterInput label="Decision">
              <select
                value={filters.decision}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, decision: e.target.value }))
                }
                style={{ width: '100%' }}
              >
                <option value="">All decisions</option>
                <option value="ALLOW">Allow</option>
                <option value="REVIEW">Review</option>
                <option value="BLOCK">Block</option>
              </select>
            </FilterInput>

            <FilterInput label="Payment Mode">
              <select
                value={filters.paymentMode}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, paymentMode: e.target.value }))
                }
                style={{ width: '100%' }}
              >
                <option value="">All modes</option>
                {MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </FilterInput>

            <FilterInput label="Date From">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, dateFrom: e.target.value }))
                }
                style={{ width: '100%' }}
              />
            </FilterInput>

            <FilterInput label="Date To">
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                style={{ width: '100%' }}
              />
            </FilterInput>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
              borderTop: '1px solid #DDE3EF',
              paddingTop: 14,
            }}
          >
            <button
              className="btn"
              onClick={() => {
                setFilters(EMPTY_FILTERS);
              }}
            >
              Reset
            </button>
            <button className="btn" onClick={() => setShowFilters(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={applyFilters}>
              <Search size={13} /> Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {Object.entries(applied)
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  background: '#EAF3FF',
                  border: '1px solid #BAD8FB',
                  borderRadius: 20,
                  padding: '3px 10px',
                  fontSize: 12,
                  color: '#1E88E5',
                }}
              >
                <span style={{ color: '#6B7280', fontSize: 11 }}>
                  {k.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <span style={{ fontWeight: 600 }}>{v}</span>
                <button
                  onClick={() => {
                    const f = { ...applied, [k]: '' };
                    setApplied(f);
                    setFilters(f);
                    setPage(0);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9CA3AF',
                    padding: 0,
                    display: 'flex',
                    lineHeight: 1,
                  }}
                >
                  <X size={11} />
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>
            Loading...
          </div>
        ) : data.content?.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>
            <Search size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
            <div>No transactions found</div>
            {activeFilterCount > 0 && (
              <div style={{ fontSize: 12, marginTop: 6 }}>
                Try adjusting your filters
              </div>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Merchant</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Risk Score</th>
                <th>Decision</th>
                <th>Rules Triggered</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {data.content?.map((txn) => (
                <React.Fragment key={txn.txnId}>
                  <tr
                    onClick={() =>
                      setExpanded(expanded === txn.txnId ? null : txn.txnId)
                    }
                    style={{ cursor: 'pointer' }}
                  >
                    <td
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 11,
                        color: '#0B2A5B',
                        fontWeight: 600,
                      }}
                    >
                      {txn.txnId}
                    </td>
                    <td style={{ fontSize: 12 }}>{txn.merchantId}</td>
                    <td
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#0B2A5B',
                      }}
                    >
                      {fmtAmount(txn.amount)}
                    </td>
                    <td>
                      {txn.paymentMode ? (
                        <span
                          style={{
                            fontSize: 11,
                            background: '#F5F7FA',
                            border: '1px solid #DDE3EF',
                            borderRadius: 6,
                            padding: '2px 8px',
                            color: '#374151',
                          }}
                        >
                          {txn.paymentMode}
                        </span>
                      ) : (
                        <span style={{ color: '#9CA3AF' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 40,
                            height: 4,
                            borderRadius: 2,
                            background: '#EAF3FF',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(txn.riskScore, 100)}%`,
                              height: '100%',
                              borderRadius: 2,
                              background:
                                txn.riskScore >= 70
                                  ? '#DC2626'
                                  : txn.riskScore >= 40
                                  ? '#D97706'
                                  : '#16A34A',
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontFamily: 'var(--mono)',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#0B2A5B',
                          }}
                        >
                          {txn.riskScore}
                        </span>
                      </div>
                    </td>
                    <td>{decisionBadge(txn.decision)}</td>
                    <td style={{ fontSize: 12 }}>
                      {txn.triggeredRules?.length && txn.triggeredRules.length > 0 ? (
                        <span style={{ color: '#D97706', fontWeight: 600 }}>
                          {txn.triggeredRules.length} rule
                          {txn.triggeredRules.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span style={{ color: '#9CA3AF' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: '#6B7280' }}>
                      {fmt(txn.receivedAt)}
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {expanded === txn.txnId && (
                    <tr>
                      <td
                        colSpan={8}
                        style={{ background: '#F5F7FA', padding: '14px 16px' }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns:
                              'repeat(auto-fill, minmax(170px, 1fr))',
                            gap: 12,
                          }}
                        >
                          {[
                            ['Mobile', txn.payerMobile],
                            ['Email', txn.payerEmail],
                            ['IP Address', txn.ipAddress],
                            ['Device ID', txn.deviceId],
                            ['Card Token', txn.cardToken],
                            ['Card BIN', txn.cardBin],
                            ['VPA', txn.vpa],
                            [
                              'Latency',
                              txn.screeningMs ? `${txn.screeningMs}ms` : null,
                            ],
                          ]
                            .filter(([, v]) => v)
                            .map(([k, v]) => (
                              <div key={k}>
                                <div
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: '#9CA3AF',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginBottom: 2,
                                  }}
                                >
                                  {k}
                                </div>
                                <div
                                  style={{
                                    fontFamily: 'var(--mono)',
                                    fontSize: 12,
                                    color: '#374151',
                                  }}
                                >
                                  {v}
                                </div>
                              </div>
                            ))}
                          {txn.triggeredRules?.length &&
                            txn.triggeredRules.length > 0 && (
                              <div style={{ gridColumn: '1 / -1' }}>
                                <div
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: '#9CA3AF',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginBottom: 6,
                                  }}
                                >
                                  Triggered Rules
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: 6,
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  {txn.triggeredRules.map((r) => (
                                    <span
                                      key={r}
                                      style={{
                                        fontFamily: 'var(--mono)',
                                        fontSize: 11,
                                        padding: '2px 9px',
                                        background: '#FFFBEB',
                                        color: '#D97706',
                                        border: '1px solid #FDE68A',
                                        borderRadius: 4,
                                      }}
                                    >
                                      {r}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
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
                style={{ padding: '6px 10px' }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                className="btn"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages - 1}
                style={{ padding: '6px 10px' }}
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
