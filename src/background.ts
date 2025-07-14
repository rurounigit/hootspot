// src/background.ts
/// <reference types="chrome" />

const CONTEXT_MENU_ID_ANALYZE = "HOOTSPOT_CONTEXT_MENU_ANALYZE";
const CONTEXT_MENU_ID_COPY = "HOOTSPOT_CONTEXT_MENU_COPY";
const CONTEXT_MENU_ID_ADD = "HOOTSPOT_CONTEXT_MENU_ADD";

let dataForNewlyOpenedPanel: { text: string, autoAnalyze: boolean } | null = null;
type OpenPanelAction = 'PUSH' | 'APPEND';

/**
 * A robust function that:
 * 1. Sets the data for the side panel to "pull" when it initializes.
 * 2. Reliably opens the side panel in the correct window.
 * 3. "Pushes" the data for an instant update if the panel is already open.
 */
async function processSelection(tab: chrome.tabs.Tab, selectedText: string, autoAnalyze: boolean, action: OpenPanelAction) {
  // Ensure we have the necessary information.
  if (!selectedText || !tab.windowId) return;

  // 1. Set the data. This is the reliable "pull" mechanism for a newly opened panel.
  dataForNewlyOpenedPanel = { text: selectedText, autoAnalyze: autoAnalyze };

  // 2. Open the side panel for the specific window the user is in.
  //    This is the key fix. It works whether the panel is closed or already open.
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } catch (error) {
    console.error("HootSpot: Error opening side panel.", error);
    // If this fails, the user can still open it manually and the text will be there.
  }

  // 3. Send a message. This is the "push" mechanism for an already-open panel.
  //    Even if this fails on first open (race condition), the pull mechanism will work.
  const message = {
      type: action === 'APPEND' ? 'APPEND_TEXT_TO_PANEL' : 'PUSH_TEXT_TO_PANEL',
      text: selectedText,
      autoAnalyze: autoAnalyze
  };
  chrome.runtime.sendMessage(message, () => {
    if (chrome.runtime.lastError) { /* This is expected if the panel was not open */ }
  });
}

// This onInstalled listener remains the same and is correct.
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

// This context menu listener remains the same and is correct.
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !info.selectionText) return;
  switch (info.menuItemId) {
    case CONTEXT_MENU_ID_ANALYZE:
      await processSelection(tab, info.selectionText, true, 'PUSH');
      break;
    case CONTEXT_MENU_ID_COPY:
      await processSelection(tab, info.selectionText, false, 'PUSH');
      break;
    case CONTEXT_MENU_ID_ADD:
      await processSelection(tab, info.selectionText, false, 'APPEND');
      break;
  }
});

// This command listener remains the same and is correct.
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (!tab?.id) return;
  try {
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString(),
    });
    if (injectionResults && injectionResults[0]?.result) {
      const selectedText = injectionResults[0].result;
      switch (command) {
        case 'analyze-with-hootspot':
          await processSelection(tab, selectedText, true, 'PUSH');
          break;
        case 'copy-to-hootspot':
          await processSelection(tab, selectedText, false, 'PUSH');
          break;
        case 'add-to-hootspot':
          await processSelection(tab, selectedText, false, 'APPEND');
          break;
      }
    }
  } catch (e) {
    console.error(`HootSpot: Could not execute script in tab ${tab.id}. This can happen on protected pages like the Chrome Web Store.`, e);
  }
});

// The onMessage listener remains the same and is correct.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PULL_INITIAL_TEXT') {
    if (dataForNewlyOpenedPanel) {
      sendResponse(dataForNewlyOpenedPanel);
      dataForNewlyOpenedPanel = null;
    } else {
      sendResponse({ text: null, autoAnalyze: false });
    }
    return true;
  }
  if (request.type === 'DOWNLOAD_PDF') {
    if (request.url) {
      chrome.downloads.download({
        url: request.url,
        filename: request.filename || 'HootSpot_Analysis_Report.pdf',
        saveAs: true
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