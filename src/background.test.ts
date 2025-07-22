import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the entire chrome API before importing the background script
const chromeMock = {
  runtime: {
    onInstalled: { addListener: vi.fn() },
    onMessage: { addListener: vi.fn() },
    sendMessage: vi.fn(),
    getPlatformInfo: vi.fn().mockResolvedValue({ os: 'linux' }),
    lastError: undefined,
  },
  contextMenus: {
    create: vi.fn(),
    removeAll: vi.fn((callback) => callback()),
    onClicked: { addListener: vi.fn() },
  },
  sidePanel: {
    open: vi.fn().mockResolvedValue(undefined),
    setPanelBehavior: vi.fn().mockResolvedValue(undefined),
  },
  commands: {
    onCommand: { addListener: vi.fn() },
  },
  scripting: {
    executeScript: vi.fn(),
  },
  downloads: {
    download: vi.fn(),
  },
  i18n: {
    getMessage: vi.fn((key) => key),
  },
};
vi.stubGlobal('chrome', chromeMock);

// Import the background script AFTER the mock is in place
import './background';

describe('Chrome Extension Background Script', () => {
  beforeEach(() => {
    // Clear all mock history before each test
    vi.clearAllMocks();
    chromeMock.runtime.onInstalled.addListener.mockClear();
    chromeMock.contextMenus.onClicked.addListener.mockClear();
    chromeMock.commands.onCommand.addListener.mockClear();
  });

  it('creates context menus on installation', () => {
    // The onInstalled listener is called automatically when the script is imported.
    const onInstalledCallback = chromeMock.runtime.onInstalled.addListener.mock.calls[0][0];
    onInstalledCallback();
    expect(chromeMock.contextMenus.removeAll).toHaveBeenCalled();
    expect(chromeMock.contextMenus.create).toHaveBeenCalledTimes(3);
    expect(chromeMock.contextMenus.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'HOOTSPOT_CONTEXT_MENU_ANALYZE' })
    );
  });

  it('handles context menu clicks by opening the side panel and sending data', async () => {
    const onClickedCallback = chromeMock.contextMenus.onClicked.addListener.mock.calls[0][0];
    const info = {
      menuItemId: 'HOOTSPOT_CONTEXT_MENU_ANALYZE',
      selectionText: 'sample text',
    };
    const tab = { windowId: 1 };

    await onClickedCallback(info, tab);

    expect(chromeMock.sidePanel.open).toHaveBeenCalledWith({ windowId: 1 });
    expect(chromeMock.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'PUSH_TEXT_TO_PANEL',
        text: 'sample text',
        autoAnalyze: true,
      })
    );
  });

  it('handles command shortcuts by executing a script and sending data', async () => {
    const onCommandCallback = chromeMock.commands.onCommand.addListener.mock.calls[0][0];
    const tab = { id: 1, windowId: 1 };
    chromeMock.scripting.executeScript.mockResolvedValue([{ result: 'selected via shortcut' }]);

    await onCommandCallback('analyze-with-hootspot', tab);

    expect(chromeMock.sidePanel.open).toHaveBeenCalledWith({ windowId: 1 });
    expect(chromeMock.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 1 },
      func: expect.any(Function),
    });
    expect(chromeMock.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'PUSH_TEXT_TO_PANEL',
        text: 'selected via shortcut',
        autoAnalyze: true,
      })
    );
  });
});