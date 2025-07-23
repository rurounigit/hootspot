// src/background.test.ts
import { describe, it, expect, vi, beforeEach, type Mock, beforeAll } from 'vitest';

// Define a mutable type for the runtime part of our mock
interface MutableChromeRuntime {
  onInstalled: { addListener: Mock };
  onMessage: { addListener: Mock };
  sendMessage: Mock;
  getPlatformInfo: Mock;
  lastError: chrome.runtime.LastError | undefined; // Make this property assignable
}

// Define the complete, promise-correct mock object for the Chrome API
const mockChrome = {
  runtime: {
    onInstalled: { addListener: vi.fn() },
    onMessage: { addListener: vi.fn() },
    sendMessage: vi.fn(),
    getPlatformInfo: vi.fn(() => Promise.resolve({ os: 'linux' })),
    lastError: undefined,
  } as MutableChromeRuntime, // Cast our runtime object to the mutable type
  contextMenus: {
    create: vi.fn(),
    removeAll: vi.fn((cb) => cb && cb()),
    onClicked: { addListener: vi.fn() }
  },
  sidePanel: {
    open: vi.fn(() => Promise.resolve()),
    setPanelBehavior: vi.fn(() => Promise.resolve({}).catch(vi.fn()))
  },
  commands: {
    onCommand: { addListener: vi.fn() }
  },
  scripting: {
    executeScript: vi.fn(() => Promise.resolve([]))
  },
  downloads: {
    download: vi.fn(() => Promise.resolve(1))
  },
  i18n: {
    getMessage: vi.fn((key) => key)
  },
};

vi.stubGlobal('chrome', mockChrome);

// Import the script ONCE to execute its top-level code against the mock
await import('./background');

describe('Chrome Extension Background Script', () => {
    let onInstalledCallback: (details: chrome.runtime.InstalledDetails) => void;
    let onClickedCallback: (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => void;
    let onCommandCallback: (command: string, tab: chrome.tabs.Tab) => void;
    let onMessageCallback: (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => void;

    const mockTab: chrome.tabs.Tab = {
        id: 1, windowId: 123, index: 0, pinned: false, highlighted: true, active: true,
        incognito: false, autoDiscardable: true, discarded: false,
        selected: true, groupId: -1,
    };

    beforeAll(() => {
        onInstalledCallback = (chrome.runtime.onInstalled.addListener as Mock).mock.calls[0][0];
        onClickedCallback = (chrome.contextMenus.onClicked.addListener as Mock).mock.calls[0][0];
        onCommandCallback = (chrome.commands.onCommand.addListener as Mock).mock.calls[0][0];
        onMessageCallback = (chrome.runtime.onMessage.addListener as Mock).mock.calls[0][0];
    });

    beforeEach(() => {
      vi.clearAllMocks();
      // Reset lastError before each test
      mockChrome.runtime.lastError = undefined;
    });

    describe('Installation', () => {
      it('should create all context menus on installation', async () => {
          await onInstalledCallback({ reason: 'install' } as chrome.runtime.InstalledDetails);
          expect(chrome.contextMenus.removeAll).toHaveBeenCalled();
          expect(chrome.contextMenus.create).toHaveBeenCalledTimes(3);
      });
    });

    describe('Context Menu Actions', () => {
      it('should open side panel and prepare data for "Analyze" action', async () => {
        const mockInfo: chrome.contextMenus.OnClickData = { menuItemId: 'HOOTSPOT_CONTEXT_MENU_ANALYZE', selectionText: 'analyze text', editable: false, pageUrl:'' };
        await onClickedCallback(mockInfo, mockTab);
        expect(chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 123 });
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'PUSH_TEXT_TO_PANEL', text: 'analyze text', autoAnalyze: true }, expect.any(Function));
      });

      it('should open side panel and prepare data for "Copy" action', async () => {
        const mockInfo: chrome.contextMenus.OnClickData = { menuItemId: 'HOOTSPOT_CONTEXT_MENU_COPY', selectionText: 'copy text', editable: false, pageUrl:'' };
        await onClickedCallback(mockInfo, mockTab);
        expect(chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 123 });
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'PUSH_TEXT_TO_PANEL', text: 'copy text', autoAnalyze: false }, expect.any(Function));
      });

      it('should open side panel and send "Add" message', async () => {
        const mockInfo: chrome.contextMenus.OnClickData = { menuItemId: 'HOOTSPOT_CONTEXT_MENU_ADD', selectionText: 'add text', editable: false, pageUrl:'' };
        await onClickedCallback(mockInfo, mockTab);
        expect(chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 123 });
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'APPEND_TEXT_TO_PANEL', text: 'add text', autoAnalyze: false }, expect.any(Function));
      });
    });

    describe('Keyboard Shortcut Actions', () => {
      it('should execute "analyze-with-hootspot" command', async () => {
        (chrome.scripting.executeScript as Mock).mockResolvedValue([{ result: 'analyze from shortcut' }]);
        await onCommandCallback('analyze-with-hootspot', mockTab);
        expect(chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 123 });
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'PUSH_TEXT_TO_PANEL', text: 'analyze from shortcut', autoAnalyze: true }, expect.any(Function));
      });

      it('should execute "copy-to-hootspot" command', async () => {
        (chrome.scripting.executeScript as Mock).mockResolvedValue([{ result: 'copy from shortcut' }]);
        await onCommandCallback('copy-to-hootspot', mockTab);
        expect(chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 123 });
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'PUSH_TEXT_TO_PANEL', text: 'copy from shortcut', autoAnalyze: false }, expect.any(Function));
      });

      it('should execute "add-to-hootspot" command', async () => {
        (chrome.scripting.executeScript as Mock).mockResolvedValue([{ result: 'add from shortcut' }]);
        await onCommandCallback('add-to-hootspot', mockTab);
        expect(chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 123 });
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'APPEND_TEXT_TO_PANEL', text: 'add from shortcut', autoAnalyze: false }, expect.any(Function));
      });

      it('should handle errors when executing script', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (chrome.scripting.executeScript as Mock).mockRejectedValue(new Error('Execute failed'));
        await onCommandCallback('analyze-with-hootspot', mockTab);
        expect(chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 123 });
        expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
      });
    });

    describe('Message Handling', () => {
      it('should respond to PULL_INITIAL_TEXT if data was prepared by a PUSH action', async () => {
        const sendResponse = vi.fn();
        const mockInfo: chrome.contextMenus.OnClickData = { menuItemId: 'HOOTSPOT_CONTEXT_MENU_COPY', selectionText: 'initial text', editable: false, pageUrl:'' };
        await onClickedCallback(mockInfo, mockTab);

        onMessageCallback({ type: 'PULL_INITIAL_TEXT' }, {} as any, sendResponse);
        expect(sendResponse).toHaveBeenCalledWith({ text: 'initial text', autoAnalyze: false });
      });

      it('should respond with null when PULL_INITIAL_TEXT is called with no prepared data', () => {
        const sendResponse = vi.fn();
        onMessageCallback({ type: 'PULL_INITIAL_TEXT' }, {} as any, sendResponse);
        expect(sendResponse).toHaveBeenCalledWith({ text: null, autoAnalyze: false });
      });

      it('should handle DOWNLOAD_PDF messages', () => {
        const request = { type: 'DOWNLOAD_PDF', url: 'blob:url', filename: 'report.pdf' };
        onMessageCallback(request, {} as any, vi.fn());
        expect(chrome.downloads.download).toHaveBeenCalledWith(expect.objectContaining({ filename: 'report.pdf' }));
      });

      it('should not throw if sendMessage has a lastError (e.g., panel not open)', async () => {
        // --- THIS IS THE CORRECTED TEST ---
        // Temporarily set the lastError property for this test case
        mockChrome.runtime.lastError = { message: 'No receiving end' };

        const mockInfo: chrome.contextMenus.OnClickData = { menuItemId: 'HOOTSPOT_CONTEXT_MENU_ADD', selectionText: 'add text', editable: false, pageUrl:'' };

        // This assertion checks that the function runs to completion without throwing an error
        await expect(onClickedCallback(mockInfo, mockTab)).resolves.not.toThrow();

        // We still expect sendMessage to have been called
        expect(chrome.runtime.sendMessage).toHaveBeenCalled();
      });
    });
});