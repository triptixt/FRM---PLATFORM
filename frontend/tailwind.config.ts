import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0B2A5B',
          DEFAULT: '#1E88E5',
          light: '#4FA3F7',
          tint: '#EAF3FF',
          hover: '#1565C0',
        },
        surface: {
          DEFAULT: '#F5F7FA',
          card: '#FFFFFF',
          alt: '#FAFBFE',
          subtle: '#F0F4FF',
        },
        border: {
          DEFAULT: '#DDE3EF',
          muted: '#E5E7EB',
          strong: '#C5D0E8',
        },
        frm: {
          green: '#16A34A',
          'green-bg': '#F0FDF4',
          'green-border': '#BBF7D0',
          amber: '#D97706',
          'amber-bg': '#FFFBEB',
          'amber-border': '#FDE68A',
          red: '#DC2626',
          'red-bg': '#FEF2F2',
          'red-border': '#FECACA',
          blue: '#1E88E5',
          'blue-bg': '#EAF3FF',
          'blue-border': '#BAD8FB',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(11,42,91,0.06), 0 1px 2px rgba(11,42,91,0.04)',
        card: '0 2px 8px rgba(11,42,91,0.06)',
        elevated: '0 12px 32px rgba(11,42,91,0.12)',
        modal: '0 24px 64px rgba(11,42,91,0.22)',
      },
      borderRadius: {
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
};

export default config;

