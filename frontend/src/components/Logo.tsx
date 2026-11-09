import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
  light?: boolean;
}

export function Logo({ size = 32, showText = true, light = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <rect width="120" height="120" rx="20" fill="url(#logo_grad)" />
        {/* P Circuit */}
        <rect x="22" y="28" width="4" height="64" rx="2" fill="white" opacity="0.9" />
        <path
          d="M26 28 H46 Q62 28 62 44 Q62 60 46 60 H26"
          stroke="white"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="26" cy="28" r="3" fill="white" />
        <circle cx="52" cy="34" r="2.5" fill="white" opacity="0.75" />
        <circle cx="58" cy="44" r="2.5" fill="white" opacity="0.75" />
        <circle cx="52" cy="54" r="2.5" fill="white" opacity="0.75" />
        <circle cx="26" cy="60" r="3" fill="white" />
        <circle cx="26" cy="92" r="3" fill="white" />

        {/* Y Circuit */}
        <path
          d="M72 28 L86 52 L100 28"
          stroke="white"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M86 52 L86 92" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="72" cy="28" r="3" fill="white" />
        <circle cx="100" cy="28" r="3" fill="white" />
        <circle cx="86" cy="52" r="3.5" fill="white" />
        <circle cx="86" cy="92" r="3" fill="white" />
        <circle cx="79" cy="40" r="2" fill="white" opacity="0.65" />
        <circle cx="93" cy="40" r="2" fill="white" opacity="0.65" />
        <circle cx="86" cy="72" r="2" fill="white" opacity="0.65" />

        <defs>
          <linearGradient id="logo_grad" x1="0" y1="0" x2="120" y2="120">
            <stop offset="0%" stopColor="#0B2A5B" />
            <stop offset="100%" stopColor="#1E88E5" />
          </linearGradient>
        </defs>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <div
            className={`font-bold tracking-tight leading-none text-base ${
              light ? 'text-white' : 'text-[#0B2A5B]'
            }`}
          >
            Pay<span className="text-[#1E88E5]">Yantra</span>
          </div>
          <span
            className={`text-[9px] tracking-widest font-semibold uppercase mt-0.5 ${
              light ? 'text-white/60' : 'text-gray-400'
            }`}
          >
            FRM PLATFORM
          </span>
        </div>
      )}
    </div>
  );
}

