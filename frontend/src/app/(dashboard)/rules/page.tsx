'use client';

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { rulesAPI } from '@/services/api';
import type { Rule } from '@/types';
import axios from 'axios';
import { RefreshCw, ToggleLeft, ToggleRight, Edit2, X, Info, ChevronDown, ChevronUp } from 'lucide-react';

const typeColor: Record<string, { bg: string; color: string }> = {
  STATIC: { bg: '#EAF3FF', color: '#1E88E5' },
  AGGREGATION: { bg: '#FFFBEB', color: '#D97706' },
};
const actionColor: Record<string, { bg: string; color: string }> = {
  BLOCK: { bg: '#FEF2F2', color: '#DC2626' },
  SCORE: { bg: '#F0FDF4', color: '#16A34A' },
};
const WINDOWS = ['1m', '5m', '10m', '15m', '30m', '1h', '6h', '1d'];
const WL: Record<string, string> = {
  '1m': '1 min',
  '5m': '5 mins',
  '10m': '10 mins',
  '15m': '15 mins',
  '30m': '30 mins',
  '1h': '1 hour',
  '6h': '6 hours',
  '1d': '1 day',
};

interface ConditionLine {
  label: string;
  value: any;
  highlight?: boolean;
}

function parseCondition(condJson: any, ruleType: string): ConditionLine[] {
  if (!condJson) return [];
  try {
    const c = typeof condJson === 'string' ? JSON.parse(condJson) : condJson;
    const lines: ConditionLine[] = [];
    if (ruleType === 'AGGREGATION') {
      const ml: Record<string, string> = { COUNT: 'txn count', SUM: 'cumulative ₹', DISTINCT_COUNT: 'distinct' };
      lines.push({ label: 'Entity', value: c.entity });
      lines.push({ label: 'Metric', value: ml[c.metric] || c.metric });
      if (c.field) lines.push({ label: 'Field', value: c.field });
      lines.push({ label: 'Window', value: c.window, highlight: true });
      lines.push({
        label: 'Threshold',
        value: c.metric === 'SUM' ? `₹${Number(c.threshold).toLocaleString('en-IN')}` : c.threshold,
        highlight: true,
      });
    } else {
      if (c.operator === 'IN_BLACKLIST') {
        lines.push({ label: 'Check', value: `${c.field} vs blacklist` });
        lines.push({ label: 'Type', value: c.entityType });
      } else {
        lines.push({ label: 'Field', value: c.field });
        lines.push({ label: 'Operator', value: c.operator });
        if (c.value) {
          lines.push({
            label: 'Value',
            value: c.field === 'amount' ? `₹${Number(c.value).toLocaleString('en-IN')}` : c.value,
            highlight: true,
          });
        }
        if (c.paymentModeIn) lines.push({ label: 'Modes', value: c.paymentModeIn });
      }
    }
    return lines;
  } catch {
    return [{ label: 'Raw', value: JSON.stringify(condJson) }];
  }
}

function EditModal({
  rule,
  onClose,
  onSaved,
}: {
  rule: Rule;
  onClose: () => void;
  onSaved: () => void;
}) {
  const condJson =
    typeof rule.conditionJson === 'string'
      ? JSON.parse(rule.conditionJson)
      : rule.conditionJson || {};
  const [values, setValues] = useState<any>({ ...condJson });
  const [riskScore, setRiskScore] = useState<number>(rule.riskScore);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isBlacklist = condJson?.operator === 'IN_BLACKLIST';
  const isAggregation = rule.ruleType === 'AGGREGATION';

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await axios.put(`/admin/rules/${rule.ruleId}`, {
        conditionJson: values,
        riskScore: parseInt(String(riskScore), 10),
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const condLines = parseCondition(values, rule.ruleType);
  const F = ({
    label,
    help,
    children,
  }: {
    label: string;
    help?: string;
    children: React.ReactNode;
  }) => (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 600,
          color: '#374151',
          marginBottom: 2,
        }}
      >
        {label}
      </label>
      {help && (
        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>
          {help}
        </div>
      )}
      {children}
    </div>
  );

  return ReactDOM.createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(11,42,91,0.45)',
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
          width: 480,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(11,42,91,0.25)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '18px 22px 14px',
            borderBottom: '1px solid #DDE3EF',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0B2A5B' }}>
                Edit Rule
              </div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: '#1E88E5',
                  marginTop: 2,
                }}
              >
                {rule.ruleCode}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                {rule.ruleName}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9CA3AF',
                padding: 4,
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div style={{ overflow: 'auto', padding: '18px 22px', flex: 1 }}>
          {error && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 8,
                padding: '9px 12px',
                marginBottom: 14,
                color: '#DC2626',
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}
          {isBlacklist ? (
            <div
              style={{
                background: '#EAF3FF',
                borderRadius: 8,
                padding: '12px 14px',
                fontSize: 13,
                color: '#1E88E5',
              }}
            >
              Blacklist rules have no threshold to edit. Manage entries via the
              Blacklist page.
            </div>
          ) : (
            <>
              <div
                style={{
                  background: '#F5F7FA',
                  borderRadius: 8,
                  padding: '11px 13px',
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#9CA3AF',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    marginBottom: 7,
                  }}
                >
                  Current condition
                </div>
                {condLines.map((l, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', gap: 8, marginBottom: 3, fontSize: 12 }}
                  >
                    <span style={{ color: '#9CA3AF', minWidth: 80, flexShrink: 0 }}>
                      {l.label}
                    </span>
                    <span
                      style={{
                        color: l.highlight ? '#0B2A5B' : '#374151',
                        fontWeight: l.highlight ? 700 : 400,
                        fontFamily: 'var(--mono)',
                      }}
                    >
                      {l.value}
                    </span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginBottom: 12,
                }}
              >
                Edit thresholds
              </div>
              {isAggregation ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0 14px',
                  }}
                >
                  <F
                    label="Threshold"
                    help={
                      condJson.metric === 'SUM'
                        ? 'Amount in ₹'
                        : 'Max transaction count'
                    }
                  >
                    <input
                      type="number"
                      value={values.threshold || ''}
                      style={{ width: '100%' }}
                      onChange={(e) =>
                        setValues((v: any) => ({ ...v, threshold: e.target.value }))
                      }
                    />
                  </F>
                  <F label="Time Window" help="Rolling evaluation window">
                    <select
                      value={values.window || '5m'}
                      style={{ width: '100%' }}
                      onChange={(e) =>
                        setValues((v: any) => ({ ...v, window: e.target.value }))
                      }
                    >
                      {WINDOWS.map((w) => (
                        <option key={w} value={w}>
                          {WL[w]}
                        </option>
                      ))}
                    </select>
                  </F>
                </div>
              ) : (
                <>
                  {condJson.value !== undefined && (
                    <F
                      label={
                        condJson.field === 'amount'
                          ? 'Amount threshold (₹)'
                          : 'Value'
                      }
                      help="Threshold for this condition"
                    >
                      <input
                        type="text"
                        value={values.value || ''}
                        style={{ width: '100%' }}
                        onChange={(e) =>
                          setValues((v: any) => ({ ...v, value: e.target.value }))
                        }
                      />
                    </F>
                  )}
                  {condJson.paymentModeIn !== undefined && (
                    <F label="Payment modes" help="e.g. CARD, UPI, BNPL, EMI">
                      <input
                        type="text"
                        value={values.paymentModeIn || ''}
                        style={{ width: '100%' }}
                        onChange={(e) =>
                          setValues((v: any) => ({
                            ...v,
                            paymentModeIn: e.target.value,
                          }))
                        }
                      />
                    </F>
                  )}
                </>
              )}
              <div
                style={{
                  borderTop: '1px solid #DDE3EF',
                  paddingTop: 14,
                  marginTop: 2,
                }}
              >
                <F
                  label="Risk Score"
                  help="0 = no impact · 40+ = review · 70+ = block"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={riskScore}
                      onChange={(e) => setRiskScore(Number(e.target.value))}
                      style={{ flex: 1, padding: 0, boxShadow: 'none' }}
                    />
                    <span
                      style={{
                        fontFamily: 'var(--mono)',
                        fontWeight: 700,
                        fontSize: 15,
                        color: '#0B2A5B',
                        minWidth: 30,
                        textAlign: 'right',
                      }}
                    >
                      {riskScore}
                    </span>
                  </div>
                </F>
              </div>
              <div
                style={{
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: 6,
                  padding: '7px 11px',
                  fontSize: 11,
                  color: '#92400E',
                }}
              >
                <strong>Note:</strong> Rule code, name, type and action are
                read-only. Changes take effect within <strong>60 seconds</strong>.
              </div>
            </>
          )}
        </div>

        <div
          style={{
            padding: '12px 22px',
            borderTop: '1px solid #DDE3EF',
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            background: '#FAFBFE',
            flexShrink: 0,
          }}
        >
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          {!isBlacklist && (
            <button
              className="btn btn-primary"
              onClick={save}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Rules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const r = await rulesAPI.list();
      setRules((r.data.data || []).sort((a, b) => a.priority - b.priority));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const toggle = async (rule: Rule) => {
    const s = rule.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setToggling(rule.ruleId);
    try {
      await rulesAPI.toggle(rule.ruleId, s);
      setRules((r) =>
        r.map((x) => (x.ruleId === rule.ruleId ? { ...x, status: s } : x))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(null);
    }
  };

  const activeCount = rules.filter((r) => r.status === 'ACTIVE').length;

  return (
    <div style={{ padding: '24px 28px' }} className="fade-in">
      {editing && (
        <EditModal
          rule={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#0B2A5B',
              letterSpacing: '-0.02em',
            }}
          >
            Fraud Rules
          </h1>
          <p style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>
            {activeCount} active · {rules.length} total · click row to expand
            condition
          </p>
        </div>
        <button
          className="btn"
          onClick={load}
          disabled={loading}
          style={{ fontSize: 12 }}
        >
          <RefreshCw size={12} className={loading ? 'pulse' : ''} /> Refresh
        </button>
      </div>

      <div
        style={{
          background: '#EAF3FF',
          border: '1px solid #BAD8FB',
          borderRadius: 7,
          padding: '8px 12px',
          marginBottom: 16,
          display: 'flex',
          gap: 7,
          alignItems: 'center',
        }}
      >
        <Info size={13} style={{ color: '#1E88E5', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: '#374151' }}>
          <strong style={{ color: '#0B2A5B' }}>
            Rule codes are identity-based
          </strong>{' '}
          — thresholds and windows live in the Condition column only. Click{' '}
          <strong>Edit</strong> to change any value — takes effect within 60
          seconds.
        </span>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
            Loading rules...
          </div>
        ) : (
          <table
            style={{
              fontSize: 12,
              tableLayout: 'fixed',
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <colgroup>
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ padding: '10px 12px' }}>Rule Code</th>
                <th style={{ padding: '10px 12px' }}>Name</th>
                <th style={{ padding: '10px 12px' }}>Type</th>
                <th style={{ padding: '10px 8px' }}>Scope</th>
                <th style={{ padding: '10px 12px' }}>Condition</th>
                <th style={{ padding: '10px 8px' }}>Action</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
                <th style={{ padding: '10px 6px', textAlign: 'center' }}>
                  Edit
                </th>
                <th style={{ padding: '10px 6px', textAlign: 'center' }}>
                  Enable
                </th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => {
                const condLines = parseCondition(
                  rule.conditionJson,
                  rule.ruleType
                );
                const isExp = expanded === rule.ruleId;
                const tc = typeColor[rule.ruleType] || typeColor.STATIC;
                const ac = actionColor[rule.action] || actionColor.SCORE;
                return (
                  <React.Fragment key={rule.ruleId}>
                    <tr
                      onClick={() => setExpanded(isExp ? null : rule.ruleId)}
                      style={{
                        cursor: 'pointer',
                        opacity: rule.status === 'INACTIVE' ? 0.4 : 1,
                      }}
                    >
                      {/* Rule Code */}
                      <td
                        style={{
                          padding: '11px 12px',
                          verticalAlign: 'top',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--mono)',
                            fontSize: 10,
                            color: '#0B2A5B',
                            fontWeight: 700,
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {rule.ruleCode}
                        </span>
                      </td>

                      {/* Name */}
                      <td
                        style={{
                          padding: '11px 12px',
                          verticalAlign: 'top',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: '#374151',
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {rule.ruleName}
                        </div>
                      </td>

                      {/* Type */}
                      <td
                        style={{
                          padding: '11px 12px',
                          verticalAlign: 'top',
                        }}
                      >
                        <span
                          className="badge"
                          style={{
                            background: tc.bg,
                            color: tc.color,
                            border: `1px solid ${tc.color}30`,
                            fontSize: 10,
                            padding: '2px 6px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {rule.ruleType === 'AGGREGATION'
                            ? 'AGGREG.'
                            : rule.ruleType}
                        </span>
                      </td>

                      {/* Scope */}
                      <td
                        style={{
                          padding: '11px 8px',
                          verticalAlign: 'top',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            color: '#6B7280',
                            fontFamily: 'var(--mono)',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {rule.entityScope}
                        </span>
                      </td>

                      {/* Condition */}
                      <td
                        style={{
                          padding: '11px 12px',
                          verticalAlign: 'top',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 3,
                          }}
                        >
                          {condLines
                            .slice(0, isExp ? condLines.length : 3)
                            .map((l, i) => (
                              <div
                                key={i}
                                style={{ display: 'flex', gap: 6, fontSize: 10 }}
                              >
                                <span
                                  style={{
                                    color: '#9CA3AF',
                                    minWidth: 56,
                                    flexShrink: 0,
                                  }}
                                >
                                  {l.label}
                                </span>
                                <span
                                  style={{
                                    color: l.highlight ? '#0B2A5B' : '#374151',
                                    fontWeight: l.highlight ? 700 : 400,
                                    fontFamily: 'var(--mono)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {l.value}
                                </span>
                              </div>
                            ))}
                          {condLines.length > 3 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpanded(isExp ? null : rule.ruleId);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#1E88E5',
                                fontSize: 10,
                                padding: 0,
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                              }}
                            >
                              {isExp ? (
                                <>
                                  <ChevronUp size={9} /> less
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={9} /> +
                                  {condLines.length - 3} more
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td
                        style={{
                          padding: '11px 8px',
                          verticalAlign: 'top',
                        }}
                      >
                        <span
                          className="badge"
                          style={{
                            background: ac.bg,
                            color: ac.color,
                            border: `1px solid ${ac.color}30`,
                            fontSize: 10,
                            padding: '2px 6px',
                          }}
                        >
                          {rule.action}
                        </span>
                      </td>

                      {/* Status */}
                      <td
                        style={{
                          padding: '11px 8px',
                          verticalAlign: 'top',
                        }}
                      >
                        <span
                          className={`badge badge-${rule.status?.toLowerCase()}`}
                          style={{ fontSize: 10, padding: '2px 6px' }}
                        >
                          {rule.status}
                        </span>
                      </td>

                      {/* Edit */}
                      <td
                        style={{
                          padding: '11px 6px',
                          verticalAlign: 'top',
                          textAlign: 'center',
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(rule);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#1E88E5',
                            padding: 3,
                            borderRadius: 4,
                            display: 'inline-flex',
                          }}
                          title="Edit thresholds"
                        >
                          <Edit2 size={13} />
                        </button>
                      </td>

                      {/* Enable/Disable toggle */}
                      <td
                        style={{
                          padding: '11px 6px',
                          verticalAlign: 'top',
                          textAlign: 'center',
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle(rule);
                          }}
                          disabled={toggling === rule.ruleId}
                          title={
                            rule.status === 'ACTIVE'
                              ? 'Deactivate'
                              : 'Activate'
                          }
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor:
                              toggling === rule.ruleId ? 'wait' : 'pointer',
                            padding: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            opacity: toggling === rule.ruleId ? 0.4 : 1,
                            color:
                              rule.status === 'ACTIVE' ? '#16A34A' : '#9CA3AF',
                          }}
                        >
                          {rule.status === 'ACTIVE' ? (
                            <ToggleRight size={21} strokeWidth={1.8} />
                          ) : (
                            <ToggleLeft size={21} strokeWidth={1.8} />
                          )}
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
