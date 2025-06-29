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
        'athena-logo-bg': '#ffff', // Here is your new custom color
      },
    },
  },
  plugins: [],
}