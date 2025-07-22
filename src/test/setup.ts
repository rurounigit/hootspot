import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock the global chrome API
const chromeMock = {
  runtime: {
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    sendMessage: vi.fn(),
    getURL: (path: string) => `chrome-extension://your_extension_id/${path}`,
    getPlatformInfo: vi.fn(async () => ({ os: 'linux' })),
  },
  storage: {
    local: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
  },
  contextMenus: {
    create: vi.fn(),
    removeAll: vi.fn(),
    onClicked: {
        addListener: vi.fn(),
    },
  },
  sidePanel: {
    open: vi.fn(),
    setPanelBehavior: vi.fn(),
  },
  downloads: {
    download: vi.fn(),
  },
  commands: {
    onCommand: {
      addListener: vi.fn(),
    }
  },
  scripting: {
    executeScript: vi.fn(),
  },
  i18n: {
    getMessage: vi.fn((key) => key), // Return the key as a default mock
  },
};

vi.stubGlobal('chrome', chromeMock);

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Canvas Context for text measurement utils
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    measureText: vi.fn((text) => ({ width: text.length * 10 })),
    font: '',
})) as any;

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;
