// src/hooks/usePdfGenerator.test.tsx

import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { usePdfGenerator } from './usePdfGenerator';
import { LanguageProvider } from '../i18n';
import React from 'react';
import html2canvas from 'html2canvas';

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: () => 'data:image/png;base64,mock-image-data',
  }),
}));

// Mock React's createRoot
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
    unmount: vi.fn(),
  })),
}));

// Mock the global chrome object
vi.stubGlobal('chrome', {
  runtime: {
    getURL: (path: string) => `chrome-extension://mock/${path}`,
    sendMessage: vi.fn(),
  },
});

describe('usePdfGenerator Hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <LanguageProvider>{children}</LanguageProvider>
  );

  const mockAnalysisData = {
    analysis_summary: 'Test Summary',
    findings: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // FIX: Clean the DOM before each test to prevent side-effects and unhandled errors.
    document.body.innerHTML = '';
  });

  it('should correctly orchestrate the PDF generation process ("Happy Path")', async () => {
    const { result } = renderHook(() => usePdfGenerator(), { wrapper });

    act(() => {
      result.current.generatePdf(
        mockAnalysisData, 'source text', [], new Map(), [], null, false
      );
    });

    expect(result.current.isGenerating).toBe(true);

    // FIX: Assert on the outcome (element exists) instead of fragile call counts.
    await waitFor(() => {
      // The hidden div for html2canvas is created and removed so fast, we focus on the iframe.
      const iframe = document.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe?.style.display).toBe('none');
    });

    expect(html2canvas).toHaveBeenCalled();

    act(() => {
      const iframe = document.querySelector('iframe');
      const messageEvent = new MessageEvent('message', {
          data: { type: 'PDF_GENERATED', blob: new Blob() },
          source: iframe?.contentWindow
      });
      window.dispatchEvent(messageEvent);
    });

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
      // Verify cleanup
      expect(document.querySelector('iframe')).not.toBeInTheDocument();
    });
  });

  it('should include rebuttal in the payload only when specified', async () => {
    const { result } = renderHook(() => usePdfGenerator(), { wrapper });

    // This spy will be attached to the specific iframe's contentWindow
    const postMessageSpy = vi.fn();

    // Use a trick to grab the iframe and attach a spy to its contentWindow
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if ((node as HTMLIFrameElement).tagName === 'IFRAME') {
        Object.defineProperty(node, 'contentWindow', {
          value: { postMessage: postMessageSpy },
          writable: true,
        });
      }
      // @ts-ignore
      return Node.prototype.appendChild.call(document.body, node);
    });

    // Case 1: Rebuttal is included
    act(() => {
        result.current.generatePdf(mockAnalysisData, 'text', [], new Map(), [], 'rebuttal text', true);
    });

    // Simulate the sandbox is ready
    await waitFor(() => {
      const iframe = document.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
      const messageEvent = new MessageEvent('message', {
          data: { type: 'PDF_SANDBOX_READY' },
          source: iframe?.contentWindow
      });
      window.dispatchEvent(messageEvent);
    });

    // FIX: Now the postMessage spy should be called
    await waitFor(() => {
      expect(postMessageSpy).toHaveBeenCalled();
      const messagePayload = postMessageSpy.mock.calls[0][0];
      expect(messagePayload.type).toBe('GENERATE_PDF');
      expect(messagePayload.data.rebuttal).toBe('rebuttal text');
    });
  });

  it('should clean up DOM elements if PDF generation fails', async () => {
    const { result } = renderHook(() => usePdfGenerator(), { wrapper });

    act(() => {
        result.current.generatePdf(mockAnalysisData, 'text', [], new Map(), [], null, false);
    });

    let iframe: HTMLIFrameElement | null;
    await waitFor(() => {
        iframe = document.querySelector('iframe');
        expect(iframe).toBeInTheDocument();
    });

    act(() => {
        const messageEvent = new MessageEvent('message', {
            data: { type: 'PDF_CRASH_REPORT', payload: { errorMessage: 'Test crash' } },
            source: iframe!.contentWindow
        });
        window.dispatchEvent(messageEvent);
    });

    await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
        expect(document.querySelector('iframe')).not.toBeInTheDocument();
    });
  });
});