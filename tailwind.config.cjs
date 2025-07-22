// tailwind.config.cjs
const { themeColors } = require('./src/config/theme');

function flattenThemeColors(colors) {
  const flattened = {};
  for (const [name, variants] of Object.entries(colors)) {
    if (variants.light) flattened[`${name}-light`] = variants.light;
    if (variants.dark) flattened[`${name}-dark`] = variants.dark;
  }
  return flattened;
}

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.tsx",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ...flattenThemeColors(themeColors),
        // UPDATED: Renamed from 'athena-logo-bg'
        'hootspot-logo-bg': '#ffff',
      },
    },
  },
  plugins: [],
}