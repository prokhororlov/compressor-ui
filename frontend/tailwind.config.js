/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          // Refined gray-based color scheme with softer accents
          bg: 'oklch(0.18 0.008 264)',              // Deep charcoal background
          surface: 'oklch(0.22 0.008 264)',         // Slightly lighter surface
          border: 'oklch(0.35 0.01 264)',           // Subtle gray border
          text: 'oklch(0.92 0 0)',                  // Off-white text
          muted: 'oklch(0.55 0 0)',                 // Medium gray muted text
          neon: {
            green: 'oklch(0.65 0.14 145)',          // Softer teal-green
            cyan: 'oklch(0.70 0.10 200)',           // Muted cyan-blue (header video mode)
            blue: 'oklch(0.70 0.10 200)',           // Blue for videos (same as cyan)
            magenta: 'oklch(0.67 0.12 280)',        // Subtle purple
            yellow: 'oklch(0.65 0.20 25)',          // Red (replaces yellow)
            red: 'oklch(0.65 0.20 25)'              // Red
          }
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Source Serif 4', 'serif']
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 8s linear infinite'
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 }
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' }
        }
      }
    }
  },
  plugins: []
}
