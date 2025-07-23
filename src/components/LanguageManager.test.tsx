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

// Mock the useTranslation hook to provide spies and control its return values
vi.mock('../i18n', async (importActual) => {
  const actual = await importActual<typeof import('../i18n')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key.startsWith('lang_manager_delete_confirm') ? 'Are you sure?' : key,
      addLanguage: addLanguageMock,
      deleteLanguage: deleteLanguageMock,
      availableLanguages: { en: 'en', 'it': 'it' },
    }),
  };
});

// Mock window.confirm
window.confirm = vi.fn(() => true);

describe('LanguageManager', () => {
  const user = userEvent.setup();

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

  it('disables the "Add" button when the API key is not provided', () => {
    renderWithProvider({ apiKey: null });
    const addButton = screen.getByRole('button', { name: /lang_manager_button_add/i });
    expect(addButton).toBeDisabled();
  });

  it('displays an error when attempting to add an empty language code', async () => {
    renderWithProvider({ apiKey: 'valid-key' }); // Button is enabled
    const addButton = screen.getByRole('button', { name: /lang_manager_button_add/i });
    await user.click(addButton);
    expect(await screen.findByText('lang_manager_error_empty')).toBeInTheDocument();
  });

  it('calls translateUI and addLanguage when adding a valid language', async () => {
    const translatedData = { lang_manager_title: 'translated_title' };
    vi.mocked(GoogleTranslationApi.translateUI).mockResolvedValue(translatedData);

    vi.doMock('../locales/en.json', () => ({
        default: { lang_manager_title: 'original_title' }
    }));

    renderWithProvider({ apiKey: 'valid-key' });

    const input = screen.getByPlaceholderText('lang_manager_code_placeholder');
    await user.type(input, 'fr');

    const addButton = screen.getByRole('button', { name: /lang_manager_button_add/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(GoogleTranslationApi.translateUI).toHaveBeenCalledWith(
        'valid-key', 'fr', expect.any(String), expect.any(Function)
      );
      expect(addLanguageMock).toHaveBeenCalledWith('fr', 'fr', translatedData);
    });
  });

  it('calls deleteLanguage when the delete button is clicked and confirmed', async () => {
    renderWithProvider({ apiKey: 'valid-key' });

    const deleteButton = screen.getByRole('button', { name: /Delete it/i });
    await user.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure?');
    expect(deleteLanguageMock).toHaveBeenCalledWith('it');
  });

  it('displays an error message if translation API fails', async () => {
    vi.mocked(GoogleTranslationApi.translateUI).mockRejectedValue(new Error('API Failure'));
    renderWithProvider({ apiKey: 'valid-key' });

    const input = screen.getByPlaceholderText('lang_manager_code_placeholder');
    await user.type(input, 'es');
    const addButton = screen.getByRole('button', { name: /lang_manager_button_add/i });
    await user.click(addButton);

    expect(await screen.findByText('API Failure')).toBeInTheDocument();
  });
});