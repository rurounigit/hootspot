// tailwind.config.cjs

const { themeColors } = require('./src/ui-config');

/**
 * This function flattens the nested color theme object into a single-level
 * object that Tailwind CSS can consume. It creates names like:
 * 'app-bg-light', 'app-bg-dark', 'text-main-light', 'text-main-dark', etc.
 */
function flattenThemeColors(colors) {
  const flattened = {};
  for (const [name, variants] of Object.entries(colors)) {
    if (variants.light) flattened[`${name}-light`] = variants.light;
    if (variants.dark) flattened[`${name}-dark`] = variants.dark;
  }
  return flattened;
}

/** @type {import('tailwindcss').Config} */
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
        'athena-logo-bg': '#ffff', // Kept for specific, non-themed use cases
      },
    },
  },
  plugins: [],
}