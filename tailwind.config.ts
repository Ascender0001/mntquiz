import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Institutional green palette derived from the mnt.org.rs banner
        // gradient (#1f884e / #00904d / #007941 / #006c3a).
        brand: {
          50: '#e6f4ec',
          100: '#c3e6d1',
          200: '#8fd1a8',
          300: '#4fb87d',
          400: '#1f9d5c',
          500: '#00904d',
          600: '#007941',
          700: '#006c3a',
          800: '#005730',
          900: '#004526'
        }
      }
    }
  },
  plugins: []
};

export default config;
