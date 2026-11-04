import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { mint: '#2BB673', coral: '#FF8A3D', ink: '#23303C', muted: '#6C7782', page: '#F6F8F8', danger: '#D83F48' },
    boxShadow: { soft: '0 8px 36px rgba(41,61,69,.075)' }
  } }, plugins: []
};
export default config;
