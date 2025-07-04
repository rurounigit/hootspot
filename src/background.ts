// src/background.ts
/// <reference types="chrome" />

const CONTEXT_MENU_ID_COPY = "HOOTSPOT_CONTEXT_MENU_COPY";
const CONTEXT_MENU_ID_ANALYZE = "HOOTSPOT_CONTEXT_MENU_ANALYZE";

// This variable holds text and an instruction for a panel that is opening from a closed state.
let dataForNewlyOpenedPanel: { text: string, autoAnalyze: boolean } | null = null;

chrome.runtime.onInstalled.addListener(() => {
  // This function will create the new menus.
  const createMenus = () => {
    // Menu item 1: Just copy
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID_COPY,
      title: "Copy text to HootSpot",
      contexts: ["selection"],
    });

    // Menu item 2: Copy and analyze
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID_ANALYZE,
      title: "Analyze selected text with HootSpot",
      contexts: ["selection"],
    });
  };

  // Attempt to remove the old context menu item.
  chrome.contextMenus.remove("HOOTSPOT_CONTEXT_MENU", () => {
    // This is the crucial fix: we check for chrome.runtime.lastError.
    // If it exists, it means the menu item wasn't found, which is okay.
    // We can safely ignore the error and proceed.
    if (chrome.runtime.lastError) {
      // The old menu item might not exist, which is fine.
    }
    // Now, create the new menus regardless of whether the old one was found.
    createMenus();
  });
});

// This is the primary trigger when the user interacts with the context menu.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if ((info.menuItemId === CONTEXT_MENU_ID_COPY || info.menuItemId === CONTEXT_MENU_ID_ANALYZE) && info.selectionText && tab?.windowId) {
    const selectedText = info.selectionText;
    const windowId = tab.windowId;
    const autoAnalyze = info.menuItemId === CONTEXT_MENU_ID_ANALYZE;

    // 1. Store the data. This is for the "panel was closed" scenario (the "pull" mechanism).
    dataForNewlyOpenedPanel = { text: selectedText, autoAnalyze: autoAnalyze };

    // 2. Open the side panel. If it's already open, this is harmless.
    chrome.sidePanel.open({ windowId });

    // 3. Forcefully update the window focus to allow .focus() in the side panel.
    chrome.windows.update(windowId, { focused: true });

    // 4. Send a "push" message. This is for the "panel is already open" scenario.
    chrome.runtime.sendMessage({
      type: "PUSH_TEXT_TO_PANEL",
      text: selectedText,
      autoAnalyze: autoAnalyze,
    }, () => {
      // Gracefully handle the error if the panel was closed. The "pull" mechanism covers this.
      if (chrome.runtime.lastError) {
        // console.log("Side panel was not ready for a push, but that's okay.");
      }
    });
  }
});

// This listener handles the "pull" request from a newly opened side panel.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PULL_INITIAL_TEXT') {
    if (dataForNewlyOpenedPanel) {
      sendResponse(dataForNewlyOpenedPanel);
      dataForNewlyOpenedPanel = null; // Clear after sending to ensure it's used only once.
    } else {
      // If no text was stored, respond with null/false to complete the communication.
      sendResponse({ text: null, autoAnalyze: false });
    }
  }
  // This block is updated to use request.url instead of request.dataUrl
  else if (request.type === 'DOWNLOAD_PDF') {
    // Check for the 'url' property sent from ShareMenu.tsx
    if (request.url) {
      chrome.downloads.download({
        url: request.url, // Use the received blob: URL
        filename: 'HootSpot_Analysis_Report.pdf',
        saveAs: true // This is generally better UX for extensions
      });
    }
  }

  // This is crucial for enabling asynchronous sendResponse and must remain.
  return true;
});

// This allows users to open an empty panel by clicking the toolbar icon.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error setting side panel behavior:', error));