/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cemindo: {
          50: '#fdf2f2',
          100: '#fde6e6',
          200: '#fbd0d0',
          500: '#dc2626',
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#651616',
          red: '#c5192d',
          darkred: '#9e1222',
        }
      }
    },
  },
  plugins: [],
}

