/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tdc: {
          green: '#1b4332',     // Deep Premium Emerald
          cream: '#f8f5f0',     // Soft Elegant White/Cream
          gold: '#b79455',      // Matte Luxury Gold
          charcoal: '#2b2d42',  // Crisp Dark Text
        }
      }
    },
  },
  plugins: [],
}