import React from 'react';

export function DecisionBadge({ decision }: { decision?: string | null }) {
  if (!decision) return <span className="text-gray-400 text-xs">—</span>;
  const d = decision.toUpperCase();
  if (d === 'ALLOW') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        ALLOW
      </span>
    );
  }
  if (d === 'REVIEW') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        REVIEW
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
      BLOCK
    </span>
  );
}

export function CaseStatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-gray-400 text-xs">—</span>;
  const s = status.toUpperCase();
  if (s === 'OPEN') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        OPEN
      </span>
    );
  }
  if (s === 'REVIEWING') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        REVIEWING
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
      CLOSED
    </span>
  );
}

export function RuleTypeBadge({ type }: { type?: string | null }) {
  if (!type) return null;
  const isStatic = type.toUpperCase() === 'STATIC';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
        isStatic
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      }`}
    >
      {isStatic ? 'STATIC' : 'AGGREGATION'}
    </span>
  );
}

export function ActionBadge({ action }: { action?: string | null }) {
  if (!action) return null;
  const isBlock = action.toUpperCase() === 'BLOCK';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
        isBlock
          ? 'bg-rose-50 text-rose-700 border-rose-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      }`}
    >
      {action}
    </span>
  );
}

export function RiskScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? 'text-rose-600 bg-rose-50 border-rose-200'
      : score >= 40
      ? 'text-amber-600 bg-amber-50 border-amber-200'
      : 'text-emerald-600 bg-emerald-50 border-emerald-200';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs border ${color}`}>
      {score}
    </span>
  );
}

