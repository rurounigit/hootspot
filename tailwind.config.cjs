// tailwind.config.cjs

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.tsx",
  ],
  theme: {
    extend: {
      colors: {
        'athena-logo-bg': '#eaebeb', // Here is your new custom color
      },
    },
  },
  plugins: [],
}