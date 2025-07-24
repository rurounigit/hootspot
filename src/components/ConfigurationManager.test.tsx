// src/components/ConfigurationManager.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfigurationManager from './ConfigurationManager';
import { LanguageProvider } from '../i18n';
import * as GoogleApi from '../api/google/utils';
import * as LMStudioApi from '../api/lm-studio';
import { API_KEY_STORAGE_KEY, LM_STUDIO_URL_KEY } from '../config/storage-keys';

// Mock the API modules
vi.mock('../api/google/utils');
vi.mock('../api/lm-studio');

// Mock the useTranslation hook to provide test translations
vi.mock('../i18n', async (importOriginal) => {
    const original = await importOriginal() as any;
    return {
        ...original,
        useTranslation: () => ({
            t: (key: string) => {
                const translations: { [key: string]: string } = {
                    'config_button_save_test': 'Save & Test Configuration',
                    'success_api_key_saved': 'API Key saved and validated successfully!',
                    'success_local_connection': 'Successfully connected to LM Studio server!',
                    'error_api_key_empty': 'API key cannot be empty.',
                    'error_local_server_config_missing': 'Local server URL and model name cannot be empty.',
                };
                return translations[key] || key;
            },
        }),
    };
});

describe('ConfigurationManager', () => {
    const defaultProps: React.ComponentProps<typeof ConfigurationManager> = {
        serviceProvider: 'google',
        onServiceProviderChange: vi.fn(),
        apiKeyInput: '',
        onApiKeyInputChange: vi.fn(),
        models: { preview: [], stable: [] },
        selectedModel: 'model-1',
        onModelChange: vi.fn(),
        areModelsLoading: false,
        modelsError: null,
        lmStudioUrl: '',
        onLmStudioUrlChange: vi.fn(),
        lmStudioModel: '',
        onLmStudioModelChange: vi.fn(),
        currentMaxCharLimit: 6000,
        onMaxCharLimitSave: vi.fn(),
        isNightMode: false,
        onNightModeChange: vi.fn(),
        includeRebuttalInJson: false,
        onIncludeRebuttalInJsonChange: vi.fn(),
        includeRebuttalInPdf: false,
        onIncludeRebuttalInPdfChange: vi.fn(),
        onConfigured: vi.fn(),
        isCurrentProviderConfigured: false,
        isCollapsed: false,
        onToggleCollapse: vi.fn(),
    };

    const renderWithProvider = (props = {}) => {
        return render(
            <LanguageProvider>
                <ConfigurationManager {...defaultProps} {...props} />
            </LanguageProvider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
        const store: { [key: string]: string } = {};

        vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: any, value: any) => {
            store[key] = value;
        });

        vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: any) => {
            delete store[key];
        });
    });

    it('shows a success message and collapses on successful Google API save', async () => {
        const onToggleCollapseMock = vi.fn();
        const onConfiguredMock = vi.fn();
        renderWithProvider({ apiKeyInput: 'good-key', onToggleCollapse: onToggleCollapseMock, onConfigured: onConfiguredMock });

        vi.mocked(GoogleApi.testApiKey).mockResolvedValue(undefined);

        const saveButton = screen.getByRole('button', { name: /Save & Test Configuration/i });
        expect(saveButton).not.toBeDisabled();
        await userEvent.click(saveButton);

        expect(await screen.findByText('API Key saved and validated successfully!')).toBeInTheDocument();

        await waitFor(() => {
            expect(onToggleCollapseMock).toHaveBeenCalled();
            expect(onConfiguredMock).toHaveBeenCalledWith(true);
            expect(localStorage.setItem).toHaveBeenCalledWith(API_KEY_STORAGE_KEY, 'good-key');
        });
    });

    it('shows a success message on successful LM Studio save', async () => {
        vi.mocked(LMStudioApi.testLMStudioConnection).mockResolvedValue(undefined);
        const onToggleCollapseMock = vi.fn();
        const onConfiguredMock = vi.fn();

        renderWithProvider({
            serviceProvider: 'local',
            lmStudioUrl: 'http://test',
            lmStudioModel: 'model',
            onToggleCollapse: onToggleCollapseMock,
            onConfigured: onConfiguredMock,
        });

        const saveButton = screen.getByRole('button', { name: /Save & Test Configuration/i });
        expect(saveButton).not.toBeDisabled();
        await userEvent.click(saveButton);

        expect(await screen.findByText('Successfully connected to LM Studio server!')).toBeInTheDocument();
        await waitFor(() => {
            expect(onToggleCollapseMock).toHaveBeenCalled();
            expect(onConfiguredMock).toHaveBeenCalledWith(true);
            expect(localStorage.setItem).toHaveBeenCalledWith(LM_STUDIO_URL_KEY, 'http://test');
        });
    });

    it('shows an error message on failed Google API save', async () => {
        const onConfiguredMock = vi.fn();
        renderWithProvider({ apiKeyInput: 'bad-key', onConfigured: onConfiguredMock });
        vi.mocked(GoogleApi.testApiKey).mockRejectedValue(new Error('Invalid API key'));

        const saveButton = screen.getByRole('button', { name: /Save & Test Configuration/i });
        await userEvent.click(saveButton);

        expect(await screen.findByText('Invalid API key')).toBeInTheDocument();
        expect(onConfiguredMock).toHaveBeenCalledWith(false);
    });

    it('disables save button and shows an error for empty Google API key', async () => {
        renderWithProvider({ serviceProvider: 'google', apiKeyInput: '' });

        const saveButton = screen.getByRole('button', { name: /Save & Test Configuration/i });
        expect(saveButton).toBeDisabled();
        expect(await screen.findByText('API key cannot be empty.')).toBeInTheDocument();
    });

    it('disables save button and shows an error for empty LM Studio URL', async () => {
        renderWithProvider({ serviceProvider: 'local', lmStudioUrl: '', lmStudioModel: 'some-model' });

        const saveButton = screen.getByRole('button', { name: /Save & Test Configuration/i });
        expect(saveButton).toBeDisabled();
        expect(await screen.findByText('Local server URL and model name cannot be empty.')).toBeInTheDocument();
    });

    it('disables save button if there is a modelsError for Google provider', () => {
        renderWithProvider({
            serviceProvider: 'google',
            apiKeyInput: 'some-key',
            modelsError: 'Invalid API key',
        });

        const saveButton = screen.getByRole('button', { name: /Save & Test Configuration/i });
        expect(saveButton).toBeDisabled();
    });

    it('enables save button if there is a modelsError but the provider is local', () => {
        renderWithProvider({
            serviceProvider: 'local',
            lmStudioUrl: 'http://test',
            lmStudioModel: 'model',
            modelsError: 'This error is irrelevant for local provider',
        });

        const saveButton = screen.getByRole('button', { name: /Save & Test Configuration/i });
        expect(saveButton).not.toBeDisabled();
    });
});