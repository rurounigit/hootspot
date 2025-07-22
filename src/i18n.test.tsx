// src/i18n.test.tsx

import { render, screen, act, renderHook, waitFor } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { vi } from 'vitest';
import { LanguageProvider, useTranslation } from './i18n';

// Mock dynamic imports for built-in locale files
vi.mock('./locales/en.json', () => ({ default: { app_title: 'HootSpot' } }));
vi.mock('./locales/de.json', () => ({ default: { app_title: 'HootSpot DE' } }));

// Mock localStorage to control test environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('i18n LanguageProvider', () => {

  const TestComponent = () => {
    const { t } = useTranslation();
    return <h1>{t('app_title')}</h1>;
  };

  const wrapper = ({ children }: { children: ReactNode }) => (
    <LanguageProvider>{children}</LanguageProvider>
  );

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes with English ("en") by default', async () => {
    render(<TestComponent />, { wrapper });
    expect(await screen.findByText('HootSpot')).toBeInTheDocument();
  });

  it('loads the language from localStorage on initialization', async () => {
    localStorage.setItem('hootspot-language', 'de');
    render(<TestComponent />, { wrapper });
    expect(await screen.findByText('HootSpot DE')).toBeInTheDocument();
  });

  it('adds a new custom language and saves it to localStorage', async () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });
    const mockItalianTranslations = { app_title: 'HootSpot IT' };

    await act(async () => {
      result.current.addLanguage('it', 'it', mockItalianTranslations);
    });

    expect(result.current.language).toBe('it');
    expect(localStorage.getItem('hootspot-language')).toBe('it');
    expect(localStorage.getItem('translation_it')).toBe(JSON.stringify(mockItalianTranslations));
  });

  it('deletes a custom language and falls back to English if it was active', async () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });

    // First, add and activate Italian
    await act(async () => {
      result.current.addLanguage('it', 'it', { app_title: 'HootSpot IT' });
    });
    expect(result.current.language).toBe('it');

    // Now, delete it
    await act(async () => {
      result.current.deleteLanguage('it');
    });

    // Check that the active language falls back to 'en'
    expect(result.current.language).toBe('en');
    expect(result.current.availableLanguages).not.toHaveProperty('it');
    expect(localStorage.getItem('translation_it')).toBeNull();
  });

  it('falls back to English if a custom language translation is missing', async () => {
    // FIX: Use a non-default language code like 'it' to test the custom language logic.
    localStorage.setItem('hootspot-custom-languages', JSON.stringify({ it: 'it' }));
    localStorage.setItem('hootspot-language', 'it'); // Try to load 'it'

    const { result } = renderHook(() => useTranslation(), { wrapper });

    // Should fallback to English because 'translation_it' is not in localStorage
    await waitFor(() => expect(result.current.language).toBe('en'));
  });
});