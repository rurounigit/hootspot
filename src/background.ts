// src/background.ts
/// <reference types="chrome" />

const CONTEXT_MENU_ID = "HOOTSPOT_CONTEXT_MENU";

// This variable is the key to the "pull" mechanism.
// It temporarily holds text for a panel that is opening from a closed state.
let textForNewlyOpenedPanel: string | null = null;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Analyze selected text with HootSpot",
    contexts: ["selection"],
  });
});

// This is the primary trigger when the user interacts with the context menu.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID && info.selectionText && tab?.windowId) {
    const selectedText = info.selectionText;
    const windowId = tab.windowId;

    // 1. Store the text. This is for the "panel was closed" scenario.
    // The newly opened panel will "pull" this text.
    textForNewlyOpenedPanel = selectedText;

    // 2. Open the side panel. If it's already open, this does nothing but is harmless.
    chrome.sidePanel.open({ windowId });

    // 3. Forcefully update the window focus. This is the critical step that allows
    // the side panel's document to later successfully call .focus() on its elements.
    chrome.windows.update(windowId, { focused: true });

    // 4. Send a "push" message. This is for the "panel is already open" scenario.
    // An already-open panel will receive this immediately.
    chrome.runtime.sendMessage({
      type: "PUSH_TEXT_TO_PANEL",
      text: selectedText,
    }, () => {
      // This callback gracefully handles the expected error that occurs if the
      // panel was closed and couldn't receive the message. We can safely ignore it
      // because the "pull" mechanism will handle this case.
      if (chrome.runtime.lastError) {
        // console.log("Side panel was not ready for a push, but that's okay.");
      }
    });
  }
});

// This listener handles the "pull" request from a newly opened side panel.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PULL_INITIAL_TEXT') {
    // Respond with the stored text, if there is any.
    if (textForNewlyOpenedPanel) {
      sendResponse({ text: textForNewlyOpenedPanel });
      // IMPORTANT: Clear the text after sending it to ensure it's only used once.
      textForNewlyOpenedPanel = null;
    } else {
      // If no text was stored, respond with null to complete the communication.
      sendResponse({ text: null });
    }
  }
  // This is crucial for enabling the asynchronous sendResponse.
  return true;
});

// This allows users to open an empty panel by clicking the toolbar icon.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error setting side panel behavior:', error));