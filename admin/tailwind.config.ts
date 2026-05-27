import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0F172A',
        brand: '#7C3AED',
        ink: '#111827',
      },
      boxShadow: {
        soft: '0 18px 60px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
