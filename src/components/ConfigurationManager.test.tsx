// src/components/ConfigurationManager.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfigurationManager from './ConfigurationManager';
import { LanguageProvider } from '../i18n';
import * as GoogleUtils from '../api/google/utils';
import * as LMStudioApi from '../api/lm-studio';

vi.mock('../api/google/utils');
vi.mock('../api/lm-studio');

vi.mock('./config/GoogleConfig', () => ({
    default: (props: { apiKeyInput: string, onApiKeyInputChange: (val: string) => void }) => (
        <input data-testid="google-config-input" value={props.apiKeyInput} onChange={(e) => props.onApiKeyInputChange(e.target.value)} aria-label="Google API Key" />
    ),
}));
vi.mock('./config/LMStudioConfig', () => ({
    default: () => <div data-testid="lm-studio-config">LM Studio Config</div>,
}));

type ConfigurationManagerProps = React.ComponentProps<typeof ConfigurationManager>;

const defaultProps: ConfigurationManagerProps = {
    serviceProvider: 'google', onServiceProviderChange: vi.fn(), apiKeyInput: '', onApiKeyInputChange: vi.fn(),
    models: { preview: [], stable: [] }, selectedModel: 'model-1', onModelChange: vi.fn(),
    areModelsLoading: false, modelsError: null, lmStudioUrl: '', onLmStudioUrlChange: vi.fn(),
    lmStudioModel: '', onLmStudioModelChange: vi.fn(), currentMaxCharLimit: 6000, onMaxCharLimitSave: vi.fn(),
    isNightMode: false, onNightModeChange: vi.fn(), includeRebuttalInJson: false, onIncludeRebuttalInJsonChange: vi.fn(),
    includeRebuttalInPdf: false, onIncludeRebuttalInPdfChange: vi.fn(), onConfigured: vi.fn(),
    isCurrentProviderConfigured: false, isCollapsed: false, onToggleCollapse: vi.fn(),
};

const renderWithProvider = (props: Partial<ConfigurationManagerProps>) => {
    return render(
        <LanguageProvider>
            <ConfigurationManager {...defaultProps} {...props} />
        </LanguageProvider> // FIX: Corrected closing tag
    );
};

describe('ConfigurationManager', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('switches to LM Studio config on button click', async () => {
        const onServiceProviderChange = vi.fn();
        renderWithProvider({ onServiceProviderChange });
        const localButton = screen.getByRole('button', { name: /config_provider_local/i });
        await userEvent.click(localButton);
        expect(onServiceProviderChange).toHaveBeenCalledWith('local');
    });

    it('shows a success message and collapses on successful Google API test', async () => {
        const onConfigured = vi.fn();
        const onToggleCollapse = vi.fn();
        vi.mocked(GoogleUtils.testApiKey).mockResolvedValue(undefined);
        renderWithProvider({ apiKeyInput: 'valid-key', onConfigured, onToggleCollapse });
        const saveButton = screen.getByRole('button', { name: /config_button_save_test/i });
        await act(async () => { await userEvent.click(saveButton); });
        expect(await screen.findByText('success_api_key_saved')).toBeInTheDocument();
        expect(onConfigured).toHaveBeenCalledWith(true);
        expect(onToggleCollapse).toHaveBeenCalled();
    });

    it('shows an error message on failed Google API test', async () => {
        const onConfigured = vi.fn();
        vi.mocked(GoogleUtils.testApiKey).mockRejectedValue(new Error('Invalid key!'));
        renderWithProvider({ apiKeyInput: 'invalid-key', onConfigured });
        const saveButton = screen.getByRole('button', { name: /config_button_save_test/i });
        await act(async () => { await userEvent.click(saveButton); });
        expect(await screen.findByText('Invalid key!')).toBeInTheDocument();
        expect(onConfigured).toHaveBeenCalledWith(false);
    });

    it('shows a success message on successful LM Studio connection test', async () => {
        const onConfigured = vi.fn();
        const onToggleCollapse = vi.fn();
        vi.mocked(LMStudioApi.testLMStudioConnection).mockResolvedValue(undefined);
        renderWithProvider({ serviceProvider: 'local', lmStudioUrl: 'http://localhost:1234', lmStudioModel: 'test-model', onConfigured, onToggleCollapse });
        const saveButton = screen.getByRole('button', { name: /config_button_save_test/i });
        await act(async () => { await userEvent.click(saveButton); });
        expect(await screen.findByText('success_local_connection')).toBeInTheDocument();
        expect(onConfigured).toHaveBeenCalledWith(true);
        expect(onToggleCollapse).toHaveBeenCalled();
    });
});