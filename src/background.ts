// src/background.ts
/// <reference types="chrome" />

const CONTEXT_MENU_ID_ANALYZE = "HOOTSPOT_CONTEXT_MENU_ANALYZE";
const CONTEXT_MENU_ID_COPY = "HOOTSPOT_CONTEXT_MENU_COPY";
const CONTEXT_MENU_ID_ADD = "HOOTSPOT_CONTEXT_MENU_ADD";

let dataForNewlyOpenedPanel: { text: string, autoAnalyze: boolean } | null = null;
type OpenPanelAction = 'PUSH' | 'APPEND';

function prepareAndPushData(selectedText: string, autoAnalyze: boolean, action: OpenPanelAction) {
  dataForNewlyOpenedPanel = { text: selectedText, autoAnalyze: autoAnalyze };
  const message = {
    type: action === 'APPEND' ? 'APPEND_TEXT_TO_PANEL' : 'PUSH_TEXT_TO_PANEL',
    text: selectedText,
    autoAnalyze: autoAnalyze
  };
  chrome.runtime.sendMessage(message, () => {
    if (chrome.runtime.lastError) { /* No-op, expected if panel was not yet open */ }
  });
}

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

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !info.selectionText || !tab.windowId) return;
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
    const action: OpenPanelAction = info.menuItemId === CONTEXT_MENU_ID_ADD ? 'APPEND' : 'PUSH';
    const autoAnalyze = info.menuItemId === CONTEXT_MENU_ID_ANALYZE;
    prepareAndPushData(info.selectionText, autoAnalyze, action);
  } catch (error) {
    console.error("HootSpot: Error on context menu click.", error);
  }
});

// Listener for keyboard shortcuts.
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (!tab || !tab.id || !tab.windowId) return;

  try {
    // *** THE CORRECTED LOGIC ***
    // STEP 1: Open the side panel immediately. This is the user gesture.
    await chrome.sidePanel.open({ windowId: tab.windowId });

    // STEP 2: NOW, asynchronously get the selected text.
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString(),
    });

    if (injectionResults && injectionResults[0]?.result) {
      const selectedText = injectionResults[0].result;

      // STEP 3: Send the retrieved data to the panel, which is now open.
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

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
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
        saveAs: false
      });
    }
    return true;
  }
  return true;
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error setting side panel behavior:', error));