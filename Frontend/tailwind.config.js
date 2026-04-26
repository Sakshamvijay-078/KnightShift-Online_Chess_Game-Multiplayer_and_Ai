/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chess: {
          dark: '#1a1a1a',
          board: '#739552',
          boardLight: '#ebecd0',
          accent: '#82976E',
          panel: '#2c2c2c',
          text: '#ffffff'
        }
      }
    },
  },
  plugins: [],
}

