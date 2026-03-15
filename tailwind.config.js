/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'cyber-bg': '#050608',
        'cyber-panel': 'rgba(5, 6, 8, 0.45)',
        'cyber-card': 'rgba(10, 12, 16, 0.40)',
        'cyber-hover': 'rgba(224, 21, 21, 0.06)',
        'cyber-border': 'rgba(224, 21, 21, 0.10)',
        'cyber-border-active': 'rgba(224, 21, 21, 0.30)',
        'threat-critical': '#E00000',
        'threat-high': '#E01515',
        'threat-medium': '#D43A1A',
        'threat-low': '#C46A2A',
        'threat-info': '#8A8F98',
        'threat-safe': '#3D6B35',
        'accent-cyan': '#E01515',
        'accent-blue': '#8B0A0A',
        'accent-orange': '#D43A1A',
        'accent-red': '#E01515',
        'accent-green': '#3D6B35',
        'accent-purple': '#8B0A0A',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'Consolas', 'monospace'],
        sans: ['Inter', 'IBM Plex Sans', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'Rajdhani', 'sans-serif'],
      },
      animation: {
        'threat-pulse': 'threat-pulse 2s ease-in-out infinite',
        'ticker-scroll': 'ticker-scroll 120s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fade-in': 'fade-in 0.3s ease-out',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        'threat-pulse': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px rgba(224, 21, 21, 0.5)' },
          '50%': { opacity: '0.7', boxShadow: '0 0 20px rgba(224, 21, 21, 0.3)' },
        },
        'ticker-scroll': {
          from: { transform: 'translateX(0%)' },
          to: { transform: 'translateX(-50%)' },
        },
        'glow': {
          from: { boxShadow: '0 0 5px rgba(224, 21, 21, 0.15)' },
          to: { boxShadow: '0 0 15px rgba(224, 21, 21, 0.3)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scanline': {
          '0%': { top: '-2px' },
          '100%': { top: '100%' },
        },
      },
      boxShadow: {
        'glow-red':    '0 0 8px rgba(224, 21, 21, 0.3), 0 0 20px rgba(224, 21, 21, 0.15)',
        'glow-cyan':   '0 0 8px rgba(224, 21, 21, 0.3), 0 0 20px rgba(224, 21, 21, 0.15)',
        'glow-orange': '0 0 8px rgba(212, 58, 26, 0.3)',
      },
    },
  },
  plugins: [],
};
