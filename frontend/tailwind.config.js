/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf3f3',
          100: '#f9e2e3',
          200: '#f2c6c9',
          300: '#e79aa0',
          400: '#d95f68',
          500: '#b52025',
          600: '#9e1c21',
          700: '#82171b',
          800: '#611114',
          900: '#470d10'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
