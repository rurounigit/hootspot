// src/background.ts
/// <reference types="chrome" />

const CONTEXT_MENU_ID_ANALYZE = "HOOTSPOT_CONTEXT_MENU_ANALYZE";
const CONTEXT_MENU_ID_COPY = "HOOTSPOT_CONTEXT_MENU_COPY";
const CONTEXT_MENU_ID_ADD = "HOOTSPOT_CONTEXT_MENU_ADD";

let dataForNewlyOpenedPanel: { text: string, autoAnalyze: boolean } | null = null;
type OpenPanelAction = 'PUSH' | 'APPEND';

/**
 * A helper function that prepares the text data and sends it to the frontend.
 * This should be called only AFTER the panel has been successfully opened.
 */
function prepareAndPushData(selectedText: string, autoAnalyze: boolean, action: OpenPanelAction) {
  // Set the data for the "pull" mechanism.
  dataForNewlyOpenedPanel = { text: selectedText, autoAnalyze: autoAnalyze };

  // Send the message for the "push" mechanism.
  const message = {
    type: action === 'APPEND' ? 'APPEND_TEXT_TO_PANEL' : 'PUSH_TEXT_TO_PANEL',
    text: selectedText,
    autoAnalyze: autoAnalyze
  };
  chrome.runtime.sendMessage(message, () => {
    // This error is expected if the panel was not already open and listening.
    if (chrome.runtime.lastError) { /* No-op */ }
  });
}

// This listener sets up the context menus on installation. It is correct.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(async () => {
    const platformInfo = await chrome.runtime.getPlatformInfo();
    const isMac = platformInfo.os === 'mac';
    const modifier = isMac ? '⌥' : 'Alt';
    const shortkeyAnalyze = ` {${modifier}+Shift+A}`;
    const shortkeyCopy = ` {${modifier}+Shift+S}`;
    const shortkeyAdd = ` {${modifier}+Shift+D}`;

    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID_ANALYZE,
      title: chrome.i18n.getMessage("contextMenuAnalyze") + shortkeyAnalyze,
      contexts: ["selection"],
    });
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID_COPY,
      title: chrome.i18n.getMessage("contextMenuCopy") + shortkeyCopy,
      contexts: ["selection"],
    });
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID_ADD,
      title: chrome.i18n.getMessage("contextMenuAdd") + shortkeyAdd,
      contexts: ["selection"],
    });
  });
});

// Listener for context menu clicks.
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !info.selectionText || !tab.windowId) return;

  // KEY FIX: Open the panel immediately, as this is a valid user gesture.
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } catch (error) {
    console.error("HootSpot: Error opening side panel on context menu click.", error);
  }

  // Then, prepare and send the data.
  const action: OpenPanelAction = info.menuItemId === CONTEXT_MENU_ID_ADD ? 'APPEND' : 'PUSH';
  const autoAnalyze = info.menuItemId === CONTEXT_MENU_ID_ANALYZE;
  prepareAndPushData(info.selectionText, autoAnalyze, action);
});

// Listener for keyboard shortcuts.
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (!tab || !tab.id || !tab.windowId) return;

  // KEY FIX: Open the panel immediately, as a command is a valid user gesture.
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } catch (error) {
    console.error("HootSpot: Error opening side panel on command.", error);
  }

  // Then, perform the async operation to get the text and send it.
  try {
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString(),
    });

    if (injectionResults && injectionResults[0]?.result) {
      const selectedText = injectionResults[0].result;
      switch (command) {
        case 'analyze-with-hootspot':
          prepareAndPushData(selectedText, true, 'PUSH');
          break;
        case 'copy-to-hootspot':
          prepareAndPushData(selectedText, false, 'PUSH');
          break;
        case 'add-to-hootspot':
          prepareAndPushData(selectedText, false, 'APPEND');
          break;
      }
    }
  } catch (e) {
    console.error(`HootSpot: Could not execute script in tab ${tab.id}. This can happen on protected pages.`, e);
  }
});

// This onMessage listener remains the same and is correct.
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'PULL_INITIAL_TEXT') {
    if (dataForNewlyOpenedPanel) {
      sendResponse(dataForNewlyOpenedPanel);
      dataForNewlyOpenedPanel = null;
    } else {
      sendResponse({ text: null, autoAnalyze: false });
    }
    return true; // Keep message channel open for async response.
  }
  if (request.type === 'DOWNLOAD_PDF') {
    if (request.url) {
      chrome.downloads.download({
        url: request.url,
        filename: request.filename || 'HootSpot_Analysis_Report.pdf',
        saveAs: false
      });
    }
    return true;
  }
  return true;
});

// This remains the same and is correct.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error setting side panel behavior:', error));