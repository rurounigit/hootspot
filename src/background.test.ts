/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Define the complete mock for the chrome API that background.ts uses.
const chromeMock = {
  runtime: {
    onInstalled: { addListener: vi.fn() },
    onMessage: { addListener: vi.fn() },
    sendMessage: vi.fn(),
    getPlatformInfo: vi.fn().mockResolvedValue({ os: 'linux' }),
  },
  contextMenus: {
    create: vi.fn(),
    removeAll: vi.fn((callback) => callback && callback()),
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

// Stub the global `chrome` object before any tests run.
vi.stubGlobal('chrome', chromeMock);

describe('Chrome Extension Background Script', () => {
    // Before each test, reset modules to allow re-importing background.ts
    // and dynamically import it to ensure mocks are applied first.
    beforeEach(async () => {
        vi.resetModules();
        await import('./background');
    });

    // After each test, clear mocks for isolation.
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should attach all necessary listeners when the script is imported', () => {
        expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalledTimes(1);
        expect(chrome.contextMenus.onClicked.addListener).toHaveBeenCalledTimes(1);
        expect(chrome.commands.onCommand.addListener).toHaveBeenCalledTimes(1);
        expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
    });
});