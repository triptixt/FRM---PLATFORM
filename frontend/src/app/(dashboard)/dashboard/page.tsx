'use client';

import React, { useEffect, useState } from 'react';
import { dashboardAPI, rulesAPI } from '@/services/api';
import type { DashboardSummary, Rule } from '@/types';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  FolderOpen,
  TrendingUp,
  RefreshCw,
  FolderX,
  FolderSearch,
  Zap,
  Shield,
  LucideIcon,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  label: string;
  value?: string | number | null;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  sub?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
  sub,
}) => (
  <div
    style={{
      background: 'white',
      borderRadius: 10,
      padding: '16px 18px',
      border: '1px solid #DDE3EF',
      boxShadow: '0 1px 3px rgba(11,42,91,0.06)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      borderTop: `3px solid ${color}`,
    }}
  >
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 9,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={17} color={color} />
    </div>
    <div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: '#0B2A5B',
          letterSpacing: '-0.03em',
          lineHeight: 1,
        }}
      >
        {value ?? '—'}
      </div>
      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4, fontWeight: 500 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color, marginTop: 2, fontWeight: 700 }}>
          {sub}
        </div>
      )}
    </div>
  </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontSize: 10,
      fontWeight: 700,
      color: '#0B2A5B',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 7,
    }}
  >
    <div
      style={{
        width: 3,
        height: 12,
        background: 'linear-gradient(to bottom, #0B2A5B, #1E88E5)',
        borderRadius: 2,
      }}
    />
    {children}
  </div>
);

// Rule type badge colors
const ruleTypeBadge: Record<string, { bg: string; color: string }> = {
  STATIC: { bg: '#EAF3FF', color: '#1E88E5' },
  AGGREGATION: { bg: '#FFFBEB', color: '#D97706' },
};

const actionBadge: Record<string, { bg: string; color: string }> = {
  BLOCK: { bg: '#FEF2F2', color: '#DC2626' },
  SCORE: { bg: '#F0FDF4', color: '#16A34A' },
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [summaryRes, rulesRes] = await Promise.all([
        dashboardAPI.summary(),
        rulesAPI.list(),
      ]);
      setData(summaryRes.data.data);
      setRules(rulesRes.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pieData = data
    ? [
        { name: 'Allowed', value: data.allowed || 0, color: '#16A34A' },
        { name: 'Review', value: data.reviewed || 0, color: '#D97706' },
        { name: 'Blocked', value: data.blocked || 0, color: '#DC2626' },
      ]
    : [];

  const totalCases =
    (data?.openCases ?? 0) +
    (data?.reviewingCases ?? 0) +
    (data?.closedCases ?? 0);

  // Rules summary stats
  const activeRules = rules.filter((r) => r.status === 'ACTIVE').length;
  const staticRules = rules.filter(
    (r) => r.ruleType === 'STATIC' && r.status === 'ACTIVE'
  ).length;
  const aggregationRules = rules.filter(
    (r) => r.ruleType === 'AGGREGATION' && r.status === 'ACTIVE'
  ).length;
  const blockRules = rules.filter(
    (r) => r.action === 'BLOCK' && r.status === 'ACTIVE'
  ).length;

  return (
    <div style={{ padding: '24px 28px' }} className="fade-in">
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
              fontWeight: 700,
              color: '#0B2A5B',
              letterSpacing: '-0.02em',
            }}
          >
            Overview
          </h1>
          <p style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>
            Real-time fraud screening summary
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

      {/* Row 1 — Transactions */}
      <SectionLabel>Transactions — Total = Allow + Review + Block</SectionLabel>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 12,
          marginBottom: 22,
        }}
      >
        <StatCard
          label="Total Screened"
          value={data?.totalTransactions}
          icon={TrendingUp}
          color="#1E88E5"
          bgColor="#EAF3FF"
        />
        <StatCard
          label="Allowed"
          value={data?.allowed}
          icon={CheckCircle}
          color="#16A34A"
          bgColor="#F0FDF4"
        />
        <StatCard
          label="Under Review"
          value={data?.reviewed}
          icon={AlertTriangle}
          color="#D97706"
          bgColor="#FFFBEB"
        />
        <StatCard
          label="Blocked"
          value={data?.blocked}
          icon={XCircle}
          color="#DC2626"
          bgColor="#FEF2F2"
          sub={data?.blockRate}
        />
      </div>

      {/* Row 2 — Cases */}
      <SectionLabel>Cases — Generated for Review + Block decisions</SectionLabel>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 12,
          marginBottom: 22,
        }}
      >
        <StatCard
          label="Total Cases"
          value={totalCases}
          icon={FolderOpen}
          color="#0B2A5B"
          bgColor="#EAF3FF"
        />
        <StatCard
          label="Open"
          value={data?.openCases}
          icon={FolderOpen}
          color="#D97706"
          bgColor="#FFFBEB"
        />
        <StatCard
          label="Under Review"
          value={data?.reviewingCases ?? 0}
          icon={FolderSearch}
          color="#1E88E5"
          bgColor="#EAF3FF"
        />
        <StatCard
          label="Closed"
          value={data?.closedCases}
          icon={FolderX}
          color="#16A34A"
          bgColor="#F0FDF4"
        />
      </div>

      {/* Row 3 — Chart + Rules summary side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Pie chart */}
        <div>
          <SectionLabel>Decision Breakdown</SectionLabel>
          <div
            style={{
              background: 'white',
              borderRadius: 10,
              padding: '20px 22px',
              border: '1px solid #DDE3EF',
              boxShadow: '0 1px 3px rgba(11,42,91,0.06)',
            }}
          >
            {data && pieData.some((d) => d.value > 0) ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        border: '1px solid #DDE3EF',
                        borderRadius: 8,
                        fontSize: 12,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  style={{
                    display: 'flex',
                    gap: 20,
                    justifyContent: 'center',
                    marginTop: 6,
                  }}
                >
                  {pieData.map((d) => (
                    <div
                      key={d.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 11,
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: d.color,
                        }}
                      />
                      <span style={{ color: '#6B7280' }}>{d.name}</span>
                      <span style={{ color: '#0B2A5B', fontWeight: 700 }}>
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div
                style={{
                  height: 180,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9CA3AF',
                  gap: 8,
                }}
              >
                <TrendingUp size={28} style={{ opacity: 0.2 }} />
                <div style={{ fontSize: 12 }}>No transaction data yet</div>
              </div>
            )}
          </div>
        </div>

        {/* Rules summary */}
        <div>
          <SectionLabel>Active Rules Summary</SectionLabel>
          <div
            style={{
              background: 'white',
              borderRadius: 10,
              padding: '20px 22px',
              border: '1px solid #DDE3EF',
              boxShadow: '0 1px 3px rgba(11,42,91,0.06)',
              height: 'calc(100% - 26px)',
            }}
          >
            {/* Top stats row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: 16,
              }}
            >
              {[
                {
                  label: 'Active rules',
                  value: activeRules,
                  icon: Zap,
                  color: '#1E88E5',
                  bg: '#EAF3FF',
                },
                {
                  label: 'Hard blocks',
                  value: blockRules,
                  icon: Shield,
                  color: '#DC2626',
                  bg: '#FEF2F2',
                },
                {
                  label: 'Static',
                  value: staticRules,
                  icon: Zap,
                  color: '#1E88E5',
                  bg: '#EAF3FF',
                },
                {
                  label: 'Aggregation',
                  value: aggregationRules,
                  icon: Zap,
                  color: '#D97706',
                  bg: '#FFFBEB',
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: s.bg,
                    borderRadius: 8,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Active rules list — top by priority */}
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 8,
              }}
            >
              Active rules by priority
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                maxHeight: 160,
                overflow: 'auto',
              }}
            >
              {rules
                .filter((r) => r.status === 'ACTIVE')
                .slice(0, 10)
                .map((r) => {
                  const tc = ruleTypeBadge[r.ruleType] || ruleTypeBadge.STATIC;
                  const ac = actionBadge[r.action] || actionBadge.SCORE;
                  return (
                    <div
                      key={r.ruleId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 8px',
                        background: '#F5F7FA',
                        borderRadius: 6,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--mono)',
                          fontSize: 10,
                          color: '#0B2A5B',
                          fontWeight: 600,
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.ruleCode}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: tc.bg,
                          color: tc.color,
                          flexShrink: 0,
                        }}
                      >
                        {r.ruleType.slice(0, 4)}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--mono)',
                          fontSize: 10,
                          fontWeight: 700,
                          color:
                            r.riskScore >= 70
                              ? '#DC2626'
                              : r.riskScore >= 40
                              ? '#D97706'
                              : '#16A34A',
                          flexShrink: 0,
                          minWidth: 20,
                          textAlign: 'right',
                        }}
                      >
                        {r.riskScore}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: ac.bg,
                          color: ac.color,
                          flexShrink: 0,
                        }}
                      >
                        {r.action}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
