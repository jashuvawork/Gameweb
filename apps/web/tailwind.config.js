/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: {
          950: '#05050a',
          900: '#0a0a12',
          800: '#10101c',
          700: '#161625',
        },
        neon: {
          cyan: '#00f0ff',
          magenta: '#ff2bd6',
          lime: '#7cff6b',
          gold: '#ffc857',
        },
      },
      fontFamily: {
        display: ['var(--font-orbitron)', 'sans-serif'],
        body: ['var(--font-sora)', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 24px rgba(0, 240, 255, 0.35)',
        magenta: '0 0 24px rgba(255, 43, 214, 0.35)',
      },
      backgroundImage: {
        'grid-neon':
          'linear-gradient(rgba(0,240,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.06) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
