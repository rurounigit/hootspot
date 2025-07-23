// src/background.test.ts
import { describe, it, expect, vi, beforeEach, afterEach, type Mock, beforeAll } from 'vitest';

// 1. Define the complete, promise-correct mock object
const mockChrome = {
  runtime: {
    onInstalled: { addListener: vi.fn() },
    onMessage: { addListener: vi.fn() },
    sendMessage: vi.fn(),
    getPlatformInfo: vi.fn(() => Promise.resolve({ os: 'linux' })),
    lastError: undefined as any,
  },
  contextMenus: {
    create: vi.fn(),
    removeAll: vi.fn((callback) => {
        if (callback) callback();
        return Promise.resolve();
    }),
    onClicked: { addListener: vi.fn() },
  },
  sidePanel: {
    open: vi.fn(() => Promise.resolve()),
    // This is the key fix: It returns a real promise, which has a .catch method.
    setPanelBehavior: vi.fn(() => Promise.resolve({}).catch(vi.fn())),
  },
  commands: {
    onCommand: { addListener: vi.fn() },
  },
  scripting: {
    executeScript: vi.fn(() => Promise.resolve([])),
  },
  downloads: {
    download: vi.fn(() => Promise.resolve(1)),
  },
  i18n: {
    getMessage: vi.fn((key) => key),
  },
};

// 2. Stub the global chrome object BEFORE the import
vi.stubGlobal('chrome', mockChrome);

// 3. Import the background script ONCE. This is crucial.
// This executes the top-level code in the script, including setPanelBehavior.
await import('./background');

describe('Chrome Extension Background Script', () => {
    // 4. Define variables to hold the captured listener callbacks
    let onInstalledCallback: (details: chrome.runtime.InstalledDetails) => Promise<void>;
    let onClickedCallback: (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => Promise<void>;
    let onCommandCallback: (command: string, tab: chrome.tabs.Tab) => Promise<void>;
    let onMessageCallback: (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => void;

    // 5. Capture all listener callbacks ONCE before any tests run
    beforeAll(() => {
        onInstalledCallback = (chrome.runtime.onInstalled.addListener as Mock).mock.calls[0][0];
        onClickedCallback = (chrome.contextMenus.onClicked.addListener as Mock).mock.calls[0][0];
        onCommandCallback = (chrome.commands.onCommand.addListener as Mock).mock.calls[0][0];
        onMessageCallback = (chrome.runtime.onMessage.addListener as Mock).mock.calls[0][0];
    });

    // 6. Before each test, just clear the call history of the spies
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create context menus on installation', async () => {
        // We no longer need to check addListener was called, as that happened in beforeAll.
        // We just invoke the captured callback.
        await onInstalledCallback({ reason: 'install' });
        expect(chrome.contextMenus.removeAll).toHaveBeenCalled();
        expect(chrome.contextMenus.create).toHaveBeenCalledTimes(3);
    });

    it('should handle context menu clicks correctly', async () => {
        const mockTab = { id: 1, windowId: 123 };
        const mockInfo = { menuItemId: 'HOOTSPOT_CONTEXT_MENU_ANALYZE', selectionText: 'test text' };
        await onClickedCallback(mockInfo, mockTab);
        expect(chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 123 });
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'PUSH_TEXT_TO_PANEL', text: 'test text', autoAnalyze: true }),
            expect.any(Function)
        );
    });

    it('should handle keyboard shortcuts correctly', async () => {
        const mockTab = { id: 1, windowId: 123, url: 'http://example.com' };
        (chrome.scripting.executeScript as Mock).mockResolvedValue([{ result: 'text from shortcut' }]);
        await onCommandCallback('analyze-with-hootspot', mockTab);
        expect(chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 123 });
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
            expect.objectContaining({ text: 'text from shortcut' }),
            expect.any(Function)
        );
    });

    it('should respond to PULL_INITIAL_TEXT if data is available', async () => {
        const sendResponse = vi.fn();
        const mockTab = { id: 1, windowId: 123 };
        await onClickedCallback({ menuItemId: 'HOOTSPOT_CONTEXT_MENU_COPY', selectionText: 'initial text' }, mockTab);
        onMessageCallback({ type: 'PULL_INITIAL_TEXT' }, {}, sendResponse);
        expect(sendResponse).toHaveBeenCalledWith({ text: 'initial text', autoAnalyze: false });
    });

     it('should handle PDF downloads', () => {
        const request = { type: 'DOWNLOAD_PDF', url: 'blob:url', filename: 'report.pdf' };
        onMessageCallback(request, {}, vi.fn());
        expect(chrome.downloads.download).toHaveBeenCalledWith(expect.objectContaining({ filename: 'report.pdf' }));
    });
});