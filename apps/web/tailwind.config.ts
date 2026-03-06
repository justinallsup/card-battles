import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './pages/**/*.{ts,tsx,js,jsx}',
    './lib/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        surface: '#12121a',
        border: '#1e1e2e',
        accent: '#6c47ff',
        'accent-hover': '#5a35ee',
        muted: '#64748b',
        subtle: '#374151',
        text: '#f1f5f9',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(108, 71, 255, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(108, 71, 255, 0.6), 0 0 40px rgba(108, 71, 255, 0.2)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
