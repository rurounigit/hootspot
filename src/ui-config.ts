// src/ui-config.ts
/**
 * Centralized color palette for the HootSpot UI.
 * To change a color, modify the hex code here, and Tailwind will apply it across the app.
 * Each key defines a semantic color name with 'light' and 'dark' variants.
 */
export const themeColors = {
  // Application Background
  'app-bg': { light: '#f3f4f6', dark: '#4b5563' }, // gray-100, gray-600

  // Default Text & Links
  'text-main': { light: '#1f2937', dark: '#f9fafb' }, // gray-800, gray-50
  'text-subtle': { light: '#4b5563', dark: '#9ca3af' }, // gray-600, gray-400
  'text-label': { light: '#374151', dark: '#d1d5db' }, // gray-700, gray-300
  'link': { light: '#2563eb', dark: '#60a5fa' }, // blue-600, blue-400
  'link-hover': { light: '#1d4ed8', dark: '#93c5fd' }, // blue-800, blue-300
  'text-danger': { light: '#dc2626', dark: '#f87171'}, // red-600, red-400
  'text-success': { light: '#16a34a', dark: '#4ade80'}, // green-600, green-400

  // Panels, Cards, and Containers
  'panel-bg': { light: '#ffffff', dark: '#1f2937' }, // white, gray-800
  'panel-border': { light: '#e5e7eb', dark: '#374151' }, // gray-200, gray-700
  'container-bg': { light: '#f9fafb', dark: 'rgba(31, 41, 55, 0.5)' }, // gray-50, gray-800/50
  'container-border': { light: '#e5e7eb', dark: '#4b5563' }, // gray-200, gray-600
  'divider': { light: '#e5e7eb', dark: '#4b5563' }, // gray-200, gray-600

  // Inputs & Toggles
  'input-bg': { light: '#ffffff', dark: '#374151' }, // white, gray-700
  'input-border': { light: '#d1d5db', dark: '#4b5563' }, // gray-300, gray-600
  'input-text': { light: '#111827', dark: '#f9fafb' }, // gray-900, gray-50
  'toggle-bg-off': { light: '#d1d5db', dark: '#4b5563' }, // gray-300, gray-600
  'toggle-bg-on': { light: '#2563eb', dark: '#2563eb' }, // blue-600

  // Buttons
  'button-primary-bg': { light: '#2563eb', dark: '#2563eb' }, // blue-600
  'button-primary-hover': { light: '#1d4ed8', dark: '#1e40af' }, // blue-700, blue-800
  'button-secondary-bg': { light: '#6b7280', dark: '#52525b' }, // gray-500, zinc-600
  'button-secondary-hover': { light: '#4b5563', dark: '#3f3f46' }, // gray-600, zinc-700
  'button-success-bg': { light: '#16a34a', dark: '#16a34a' }, // green-600
  'button-success-hover': { light: '#15803d', dark: '#15803d' }, // green-700
  'button-disabled-bg': { light: '#9ca3af', dark: '#4b5563' }, // gray-400, gray-600
  'button-text-light': { light: '#ffffff', dark: '#ffffff' }, // white
  'button-text-dark': { light: '#374151', dark: '#e5e7eb' }, // gray-700, gray-200

  // Banners & Status Messages
  // --- THIS IS THE FIX ---
  'info-bg': { light: '#eff6ff', dark: '#1e3a8a' }, // CHANGED: blue-50, and now a SOLID blue-900
  'info-border': { light: '#bfdbfe', dark: '#1d4ed8' }, // blue-200, blue-700
  'info-text': { light: '#1e40af', dark: '#93c5fd' }, // blue-700, blue-300
  'error-bg': { light: '#fee2e2', dark: 'rgba(127, 29, 29, 0.5)' }, // red-100, red-900/50
  'error-border': { light: '#fca5a5', dark: '#ef4444' }, // red-300, red-500
  'error-text': { light: '#b91c1c', dark: '#fca5a5' }, // red-700, red-300
  'success-bg': { light: '#f0fdf4', dark: 'rgba(20, 83, 45, 0.5)' }, // green-50, green-900/50
  'success-border': { light: '#bbf7d0', dark: '#22c55e' }, // green-200, green-500
  'success-text': { light: '#166534', dark: '#86efac' }, // green-700, green-300
  'warning-bg': { light: '#fefce8', dark: 'rgba(120, 53, 15, 0.5)' }, // yellow-50, yellow-900/50
  'warning-border': { light: '#fde047', dark: '#facc15' }, // yellow-300, yellow-400
  'warning-text': { light: '#a16207', dark: '#fef08a' }, // yellow-700, yellow-300

  // Component-Specific Colors
  'card-highlight': { light: '#e0e7ff', dark: '#3730a3' }, // indigo-100, indigo-800
  'text-highlight-bg': { light: '#fecaca', dark: 'rgba(185, 28, 28, 0.6)' }, // red-200, red-800/60
  'logo-icon': { light: '#2563eb', dark: '#60a5fa' }, // blue-600, blue-400
  'sun-icon': { light: '#f59e0b', dark: '#f59e0b' }, // amber-500
  'moon-icon': { light: '#4b5563', dark: '#d1d5db' }, // gray-600, gray-300
};