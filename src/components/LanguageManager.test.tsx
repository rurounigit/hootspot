// src/components/LanguageManager.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import LanguageManager from './LanguageManager';
import { LanguageProvider, useTranslation } from '../i18n';
import * as GoogleTranslationApi from '@/api/google/translation';

// Mock the API and other modules
vi.mock('@/api/google/translation');

// Setup mock spies for the context functions
const addLanguageMock = vi.fn();
const deleteLanguageMock = vi.fn();

// Mock the useTranslation hook to provide spies
vi.mock('../i18n', async (importActual) => {
  const actual = await importActual<typeof import('../i18n')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      addLanguage: addLanguageMock,
      deleteLanguage: deleteLanguageMock,
      availableLanguages: { en: 'en' },
    }),
  };
});

describe('LanguageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProvider = (props: React.ComponentProps<typeof LanguageManager>) => {
    return render(
      <LanguageProvider>
        <LanguageManager {...props} />
      </LanguageProvider>
    );
  };

  it('disables the "Add" button when the API key is not provided', async () => {
    renderWithProvider({ apiKey: null });
    const addButton = screen.getByRole('button', { name: /lang_manager_button_add/i });
    expect(addButton).toBeDisabled();
  });

  it('calls translateUI and addLanguage when adding a language with a valid API key', async () => {
    const user = userEvent.setup();
    const translatedData = { lang_manager_title: 'translated_title' };
    vi.mocked(GoogleTranslationApi.translateUI).mockResolvedValue(translatedData);

    // Mock dynamic import
    vi.doMock('../locales/en.json', () => ({
        default: { lang_manager_title: 'original_title' }
    }));

    renderWithProvider({ apiKey: 'valid-key' });

    const input = screen.getByPlaceholderText('lang_manager_code_placeholder');
    await user.type(input, 'it');

    const addButton = screen.getByRole('button', { name: /lang_manager_button_add/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(GoogleTranslationApi.translateUI).toHaveBeenCalledWith(
        'valid-key', 'it', expect.any(String), expect.any(Function)
      );
    });

    await waitFor(() => {
        expect(addLanguageMock).toHaveBeenCalledWith('it', 'it', translatedData);
    });
  });
});