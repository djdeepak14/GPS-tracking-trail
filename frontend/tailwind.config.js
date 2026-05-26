/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#080c12',
        surface: '#0d1117',
        panel:   '#111820',
        border:  '#1c2535',
        border2: '#243044',
        accent:  '#22d3a0',
        accent2: '#3b82f6',
        accent3: '#f59e0b',
        accent4: '#c084fc',
        muted:   '#64748b',
        faint:   '#1e293b',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'monospace'],
        body:    ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '10px',
        lg: '16px',
        xl: '24px',
      },
    },
  },
  plugins: [],
};
