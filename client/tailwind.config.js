/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          'red-clay': '#802A02',
          'forest-green': '#2B3901',
          'off-white': '#F0EEE0',
          'desert-mauve': '#EEC8B3',
          'black': '#131313',
          // Legacy/convenience
          50: '#F0EEE0',
          100: '#EEC8B3',
          500: '#802A02',
          600: '#802A02',
          700: '#6B2302',
          800: '#2B3901',
          900: '#131313',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
