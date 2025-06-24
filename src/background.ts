/// <reference types="chrome" />

// background.ts
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('Error setting side panel behavior:', error));
});

// Ensure the side panel behavior is set on browser startup as well,
// as onInstalled only runs on first install or update.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error setting side panel behavior on startup:', error));