// tailwind.config.cjs

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.tsx",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'hootspot-logo-bg': '#ffff',
      },
    },
  },
  plugins: [],
}
