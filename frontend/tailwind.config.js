/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        wealth: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
        },
        health: {
          DEFAULT: '#f43f5e',
          light: '#ffe4e6',
        },
        productivity: {
          DEFAULT: '#8b5cf6',
          light: '#ede9fe',
        },
        goals: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
        },
      },
    },
  },
  plugins: [],
}
