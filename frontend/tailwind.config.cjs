/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: "#1c1c1f",
        gold: "#d4af37",
        silver: "#c0c0c0",
        roseGold: "#b76e79"
      },
      fontFamily: {
        sans: ["'Work Sans'", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};
