/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '16px', letterSpacing: '0.01em' }],
      },
      colors: {
        // ── Enterprise Uniform White System ─────────────────────────
        canvas: '#FFFFFF',
        surface: {
          base:    '#FFFFFF',
          sidebar: '#FFFFFF',
          subtle:  '#FAFAFA',
          raised:  '#FFFFFF',
          overlay: '#F4F5F7',
        },
        edge: {
          subtle:  '#EDF1F5',
          default: '#D9DEE7',
          strong:  '#B0B9C9',
        },
        ink: {
          primary:   '#172033',
          secondary: '#667085',
          muted:     '#8F9CAE',
          disabled:  '#B0B9C9',
        },
        brand: {
          DEFAULT: '#3157D5',
          hover:   '#2647B7',
          light:   '#E9EEFF',
          dark:    '#1E3A8A',
        },
        status: {
          approved:       '#16803C',
          approvedBg:     '#E6F4EA',
          approvedBorder: '#C3E8D0',
          pending:        '#B7791F',
          pendingBg:      '#FEF3D6',
          pendingBorder:  '#FDE3A7',
          rejected:       '#C53030',
          rejectedBg:     '#FCE8E6',
          rejectedBorder: '#F7C5C0',
          draft:          '#5B6880',
          draftBg:        '#F1F3F5',
          draftBorder:    '#D9DEE7',
        },
        role: {
          admin:   '#5E35B1',
          manager: '#3157D5',
          viewer:  '#0D8A5E',
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(16, 24, 40, 0.05), 0 1px 2px rgba(16, 24, 40, 0.03)',
        'modal': '0 20px 25px -5px rgba(16, 24, 40, 0.1), 0 8px 10px -6px rgba(16, 24, 40, 0.06)',
        'dropdown': '0 10px 15px -3px rgba(16, 24, 40, 0.08), 0 4px 6px -4px rgba(16, 24, 40, 0.04)',
      },
    },
  },
  plugins: [],
}
