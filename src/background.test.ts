import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define the mock at the top level
 const chromeMock = {
   runtime: {
     onInstalled: { addListener: vi.fn() },
     onMessage: { addListener: vi.fn() },
     sendMessage: vi.fn(),
     getPlatformInfo: vi.fn().mockResolvedValue({ os: 'linux' }),
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

// Stub the global `chrome` object
vi.stubGlobal('chrome', chromeMock);

// Now, import the script that uses `chrome`
import './background';

describe('Chrome Extension Background Script', () => {
    beforeEach(() => {
        // Clear mock history before each test to ensure isolation
        vi.clearAllMocks();
    });

    it('should attach all necessary listeners when the script is imported', () => {
        // Since the script runs on import, the listeners should have been added.
        expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalledTimes(1);
        expect(chrome.contextMenus.onClicked.addListener).toHaveBeenCalledTimes(1);
        expect(chrome.commands.onCommand.addListener).toHaveBeenCalledTimes(1);
        expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
    });
});
