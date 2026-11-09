import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value?: string | number | null;
  icon: LucideIcon;
  accentColor: string;
  iconBgColor: string;
  sub?: string;
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accentColor,
  iconBgColor,
  sub,
  loading = false,
}: StatCardProps) {
  return (
    <div
      className="bg-white rounded-xl p-4 sm:p-5 border border-border shadow-subtle flex items-start gap-3.5 transition-all hover:shadow-card relative overflow-hidden"
      style={{ borderTop: `3px solid ${accentColor}` }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBgColor }}
      >
        <Icon size={18} style={{ color: accentColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-2xl sm:text-3xl font-extrabold text-[#0B2A5B] tracking-tight leading-tight">
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
          ) : (
            value ?? '—'
          )}
        </div>
        <div className="text-xs font-medium text-gray-500 mt-1 truncate">{label}</div>
        {sub && (
          <div
            className="text-[11px] font-bold mt-0.5"
            style={{ color: accentColor }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

