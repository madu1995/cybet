/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyberBg: '#0a0f1d',   // Cyberpunk Dark Background
        cyberBlue: '#00d2ff', // Neon Blue Glow
        cyberDark: '#121829', // Cards Dark Color
      }
    },
  },
  plugins: [],
}