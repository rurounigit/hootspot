// src/background.test.ts
import { describe, it, expect, vi, beforeEach, type Mock, beforeAll } from 'vitest';

// Define the complete, promise-correct mock object
const mockChrome = {
  runtime: { onInstalled: { addListener: vi.fn() }, onMessage: { addListener: vi.fn() }, sendMessage: vi.fn(), getPlatformInfo: vi.fn(() => Promise.resolve({ os: 'linux' })), lastError: undefined },
  contextMenus: { create: vi.fn(), removeAll: vi.fn((cb) => cb && cb()), onClicked: { addListener: vi.fn() } },
  sidePanel: { open: vi.fn(() => Promise.resolve()), setPanelBehavior: vi.fn(() => Promise.resolve({}).catch(vi.fn())) },
  commands: { onCommand: { addListener: vi.fn() } },
  scripting: { executeScript: vi.fn(() => Promise.resolve([])) },
  downloads: { download: vi.fn(() => Promise.resolve(1)) },
  i18n: { getMessage: vi.fn((key) => key) },
};

vi.stubGlobal('chrome', mockChrome);

// Import the script ONCE to execute its top-level code against the mock
await import('./background');

describe('Chrome Extension Background Script', () => {
    let onInstalledCallback: (details: chrome.runtime.InstalledDetails) => void;
    let onClickedCallback: (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => void;
    let onCommandCallback: (command: string, tab: chrome.tabs.Tab) => void;
    let onMessageCallback: (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => void;

    // A fully-typed mock Tab object that satisfies all properties of chrome.tabs.Tab
    const mockTab: chrome.tabs.Tab = {
        id: 1, windowId: 123, index: 0, pinned: false, highlighted: true, active: true,
        incognito: false, autoDiscardable: true, discarded: false,
        // FIX: Add the missing 'selected' and 'groupId' properties
        selected: true, // 'selected' is deprecated but required by the type
        groupId: -1,    // -1 corresponds to chrome.tabGroups.TAB_GROUP_ID_NONE
    };

    beforeAll(() => {
        onInstalledCallback = (chrome.runtime.onInstalled.addListener as Mock).mock.calls[0][0];
        onClickedCallback = (chrome.contextMenus.onClicked.addListener as Mock).mock.calls[0][0];
        onCommandCallback = (chrome.commands.onCommand.addListener as Mock).mock.calls[0][0];
        onMessageCallback = (chrome.runtime.onMessage.addListener as Mock).mock.calls[0][0];
    });

    beforeEach(() => { vi.clearAllMocks(); });

    it('should create context menus on installation', async () => {
        const mockDetails: chrome.runtime.InstalledDetails = {
            reason: 'install' as chrome.runtime.OnInstalledReason,
            previousVersion: undefined, id: 'mock-id'
        };
        await onInstalledCallback(mockDetails);
        expect(chrome.contextMenus.removeAll).toHaveBeenCalled();
        expect(chrome.contextMenus.create).toHaveBeenCalledTimes(3);
    });

    it('should handle context menu clicks correctly', async () => {
        const mockInfo: chrome.contextMenus.OnClickData = {
            menuItemId: 'HOOTSPOT_CONTEXT_MENU_ANALYZE', selectionText: 'test text',
            pageUrl: 'http://example.com', editable: false
        };
        await onClickedCallback(mockInfo, mockTab);
        expect(chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 123 });
    });

    it('should handle keyboard shortcuts correctly', async () => {
        (chrome.scripting.executeScript as Mock).mockResolvedValue([{ result: 'text from shortcut' }]);
        await onCommandCallback('analyze-with-hootspot', mockTab);
        expect(chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 123 });
    });

    it('should respond to PULL_INITIAL_TEXT if data is available', async () => {
        const sendResponse = vi.fn();
        const mockInfo: chrome.contextMenus.OnClickData = {
             menuItemId: 'HOOTSPOT_CONTEXT_MENU_COPY', selectionText: 'initial text',
             pageUrl: 'http://example.com', editable: false
        };
        await onClickedCallback(mockInfo, mockTab);
        onMessageCallback({ type: 'PULL_INITIAL_TEXT' }, {} as chrome.runtime.MessageSender, sendResponse);
        expect(sendResponse).toHaveBeenCalledWith({ text: 'initial text', autoAnalyze: false });
    });

    it('should handle PDF downloads', () => {
        const request = { type: 'DOWNLOAD_PDF', url: 'blob:url', filename: 'report.pdf' };
        onMessageCallback(request, {} as chrome.runtime.MessageSender, vi.fn());
        expect(chrome.downloads.download).toHaveBeenCalledWith(expect.objectContaining({ filename: 'report.pdf' }));
    });

    it('should handle the "Copy to HootSpot" context menu click', async () => {
        // Arrange
        const mockInfo: chrome.contextMenus.OnClickData = {
          menuItemId: 'HOOTSPOT_CONTEXT_MENU_COPY', // Use the "COPY" ID
          selectionText: 'text to be copied',
          pageUrl: 'http://example.com',
          editable: false
      };
        const sendResponse = vi.fn();

        // Act: Simulate the user right-clicking and choosing "Copy text to HootSpot"
        await onClickedCallback(mockInfo, mockTab);
        // Act: Simulate the app asking for the data
        onMessageCallback({ type: 'PULL_INITIAL_TEXT' }, {} as chrome.runtime.MessageSender, sendResponse);

        // Assert
        expect(chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 123 });
        // Assert that autoAnalyze is FALSE for this action
        expect(sendResponse).toHaveBeenCalledWith({ text: 'text to be copied', autoAnalyze: false });
    });


    it('should handle the "copy-to-hootspot" keyboard command', async () => {
        // Arrange
        (chrome.scripting.executeScript as Mock).mockResolvedValue([{ result: 'text from shortcut' }]);
        const sendResponse = vi.fn();

        // Act
        await onCommandCallback('copy-to-hootspot', mockTab); // Use the "copy-to-hootspot" command
        onMessageCallback({ type: 'PULL_INITIAL_TEXT' }, {} as chrome.runtime.MessageSender, sendResponse);

        // Assert
        expect(chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 123 });
        expect(sendResponse).toHaveBeenCalledWith({ text: 'text from shortcut', autoAnalyze: false });
    });

    it('should handle the "add-to-hootspot" keyboard command', async () => {
        // Act
        (chrome.scripting.executeScript as Mock).mockResolvedValue([{ result: 'text to append' }]);
        await onCommandCallback('add-to-hootspot', mockTab);

        // Assert
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'APPEND_TEXT_TO_PANEL', text: 'text to append' }),
            expect.any(Function)
        );
    });
    it('should handle the "Add to HootSpot" context menu click', async () => {
        // Arrange
        const mockInfo: chrome.contextMenus.OnClickData = {
          menuItemId: 'HOOTSPOT_CONTEXT_MENU_ADD', // Use the "ADD" ID
          selectionText: 'text to be added',
          pageUrl: 'http://example.com',
          editable: false
        };

        // Act: Simulate the click
        await onClickedCallback(mockInfo, mockTab);

        // Assert: Verify the correct message is sent to the app
        // Note: We are checking the direct sendMessage call here, not the pull mechanism,
        // to test the "APPEND" message type.
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'APPEND_TEXT_TO_PANEL', // This is the key difference
            text: 'text to be added'
          }),
          expect.any(Function)
        );
    });

});