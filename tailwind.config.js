export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        secondary: {
          50:  '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
          950: '#4a044e',
        },
        surface: {
          // Light mode surfaces
          50:  '#f8faff',
          100: '#f1f4fd',
          200: '#e8edf9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-light': `
          radial-gradient(at 40% 20%, hsla(240,100%,94%,0.6) 0px, transparent 50%),
          radial-gradient(at 80% 0%,  hsla(278,100%,94%,0.5) 0px, transparent 50%),
          radial-gradient(at 0%  50%, hsla(224,100%,94%,0.5) 0px, transparent 50%),
          radial-gradient(at 80% 100%,hsla(304,100%,94%,0.4) 0px, transparent 50%)
        `,
        'mesh-dark': `
          radial-gradient(at 40% 20%, hsla(240,60%,12%,0.8) 0px, transparent 50%),
          radial-gradient(at 80% 0%,  hsla(278,60%,10%,0.6) 0px, transparent 50%),
          radial-gradient(at 0%  50%, hsla(224,60%,10%,0.5) 0px, transparent 50%)
        `,
      },
      boxShadow: {
        'card':      '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(99,102,241,0.06)',
        'card-hover':'0 4px 24px rgba(99,102,241,0.15)',
        'glow':      '0 0 40px rgba(99,102,241,0.3)',
        'glow-sm':   '0 0 16px rgba(99,102,241,0.2)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'gradient': 'gradient 8s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
