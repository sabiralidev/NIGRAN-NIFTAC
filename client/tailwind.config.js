/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#eef2f8',
          soft: '#f7f9fc',
          deep: '#e8edf6',
        },
        light: {
          50: '#ffffff',
          100: '#f8fafc',
          200: '#f1f5f9',
          300: '#e2e8f0',
          400: '#cbd5e1',
          500: '#94a3b8',
          600: '#64748b',
          700: '#475569',
          800: '#334155',
          900: '#0f172a',
        },
        accent: {
          blue: '#1e40af',
          'blue-bright': '#2563eb',
          cyan: '#0891b2',
          purple: '#7c3aed',
          green: '#059669',
          red: '#dc2626',
          orange: '#ea580c',
          yellow: '#d97706',
        },
        border: {
          DEFAULT: '#e6ebf3',
          light: '#f1f5f9',
          strong: '#d5dce8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '22px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(15, 23, 42, 0.05)',
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        card: '0 2px 4px -2px rgba(15, 23, 42, 0.06), 0 10px 22px -10px rgba(15, 23, 42, 0.14)',
        lift: '0 12px 26px -10px rgba(15, 23, 42, 0.18), 0 6px 12px -6px rgba(15, 23, 42, 0.10)',
      },
      backgroundImage: {
        brand: 'linear-gradient(135deg, #1e3a8a 0%, #0e7490 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in',
        'bounce-gentle': 'bounceGentle 1s infinite',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
