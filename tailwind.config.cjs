// tailwind.config.cjs

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.tsx",
  ],
  darkMode: 'class', // This enables class-based dark mode
  theme: {
    extend: {
      colors: {
        'athena-logo-bg': '#ffff', // Here is your new custom color
      },
    },
  },
  plugins: [],
}