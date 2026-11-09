'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, ListFilter, ArrowLeftRight, FolderOpen, ShieldOff, LogOut } from 'lucide-react';

const navItems = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/rules',        icon: ListFilter,      label: 'Rules' },
  { href: '/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { href: '/cases',        icon: FolderOpen,      label: 'Cases' },
  { href: '/blacklist',    icon: ShieldOff,       label: 'Blacklist' },
];

const MiniLogo = () => (
  <svg width="26" height="26" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="120" rx="16" fill="url(#sg)"/>
    <rect x="22" y="28" width="4" height="64" rx="2" fill="white" opacity="0.9"/>
    <path d="M26 28 H46 Q62 28 62 44 Q62 60 46 60 H26" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
    <circle cx="26" cy="28" r="3" fill="white"/>
    <circle cx="26" cy="60" r="3" fill="white"/>
    <circle cx="26" cy="92" r="3" fill="white"/>
    <path d="M72 28 L86 52 L100 28" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M86 52 L86 92" stroke="white" strokeWidth="4" strokeLinecap="round"/>
    <circle cx="86" cy="52" r="3.5" fill="white"/>
    <defs>
      <linearGradient id="sg" x1="0" y1="0" x2="120" y2="120">
        <stop offset="0%" stopColor="#0B2A5B"/>
        <stop offset="100%" stopColor="#1E88E5"/>
      </linearGradient>
    </defs>
  </svg>
);

export function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside style={{
      width: 200,
      flexShrink: 0,
      background: 'white',
      borderRight: '1px solid #DDE3EF',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '1px 0 4px rgba(11,42,91,0.05)',
      height: '100vh',
      userSelect: 'none',
    }}>
      {/* Brand */}
      <div style={{
        padding: '16px 16px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'linear-gradient(135deg, #0B2A5B 0%, #1565C0 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MiniLogo />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', color: 'white' }}>
              Pay<span style={{ color: '#4FA3F7' }}>Yantra</span>
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em' }}>
              FRM DASHBOARD
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        <div style={{
          fontSize: 9,
          fontWeight: 700,
          color: '#9CA3AF',
          letterSpacing: '0.08em',
          padding: '6px 8px 4px',
          textTransform: 'uppercase',
        }}>
          Navigation
        </div>
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 7,
                marginBottom: 1,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 500,
                color: isActive ? '#0B2A5B' : '#6B7280',
                background: isActive ? '#EAF3FF' : 'transparent',
                borderLeft: isActive ? '3px solid #1E88E5' : '3px solid transparent',
                transition: 'all 0.12s',
              }}
            >
              <Icon size={14} /> {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid #DDE3EF', background: '#FAFBFE' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            flexShrink: 0,
            background: 'linear-gradient(135deg, #0B2A5B, #1E88E5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: 'white',
          }}>
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#0B2A5B',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {user?.username || 'admin'}
            </div>
            <div style={{ fontSize: 10, color: '#6B7280' }}>
              {user?.role || 'ADMIN'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9CA3AF',
              padding: 3,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
