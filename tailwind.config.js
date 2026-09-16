/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff0e6',
          100: '#fed7aa',
          200: '#ffc599',
          300: '#ffa066',
          400: '#ff8f4d',
          500: '#ff7e36',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        }
      },
      fontFamily: {
        anuphan: ['Anuphan', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.375rem', // rounded-md default (6px)
      }
    },
  },
  plugins: [],
}
