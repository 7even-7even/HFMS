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
          50: '#eef8f6',
          100: '#d7eee8',
          200: '#b4ded4',
          300: '#86c6b9',
          400: '#5aab9d',
          500: '#428f82',
          600: '#347268',
          700: '#2c5d55',
          800: '#264c47',
          900: '#22403c',
        }
      }
    },
  },
  plugins: [],
}
