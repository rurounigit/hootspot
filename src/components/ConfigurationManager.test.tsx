// src/components/ConfigurationManager.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfigurationManager from './ConfigurationManager';
import { LanguageProvider } from '../i18n';
import * as GoogleApi from '../api/google/utils';
import * as LMStudioApi from '../api/lm-studio';

vi.mock('../api/google/utils');
vi.mock('../api/lm-studio');

describe('ConfigurationManager', () => {
  const defaultProps: React.ComponentProps<typeof ConfigurationManager> = {
    serviceProvider: 'google', onServiceProviderChange: vi.fn(),
    apiKeyInput: '', onApiKeyInputChange: vi.fn(),
    models: { preview: [], stable: [] }, selectedModel: 'model-1', onModelChange: vi.fn(),
    areModelsLoading: false, modelsError: null,
    lmStudioUrl: '', onLmStudioUrlChange: vi.fn(),
    lmStudioModel: '', onLmStudioModelChange: vi.fn(),
    currentMaxCharLimit: 6000, onMaxCharLimitSave: vi.fn(),
    isNightMode: false, onNightModeChange: vi.fn(),
    includeRebuttalInJson: false, onIncludeRebuttalInJsonChange: vi.fn(),
    includeRebuttalInPdf: false, onIncludeRebuttalInPdfChange: vi.fn(),
    onConfigured: vi.fn(), isCurrentProviderConfigured: false,
    isCollapsed: false, onToggleCollapse: vi.fn(),
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
  });

  it('shows a success message and collapses on successful Google API save', async () => {
    const onToggleCollapseMock = vi.fn();
    const onConfiguredMock = vi.fn();
    renderWithProvider({ apiKeyInput: 'good-key', onToggleCollapse: onToggleCollapseMock, onConfigured: onConfiguredMock });

    vi.mocked(GoogleApi.testApiKey).mockResolvedValue();

    // Use findByRole to wait for the button text to be translated and rendered.
    const saveButton = await screen.findByRole('button', { name: /Save & Test Configuration/i });
    await userEvent.click(saveButton);

    expect(await screen.findByText('API Key saved and validated successfully!')).toBeInTheDocument();

    await waitFor(() => {
        expect(onToggleCollapseMock).toHaveBeenCalled();
        expect(onConfiguredMock).toHaveBeenCalledWith(true);
    });
  });

  it('shows a success message on successful LM Studio save', async () => {
    vi.mocked(LMStudioApi.testLMStudioConnection).mockResolvedValue();
    const onToggleCollapseMock = vi.fn();

    renderWithProvider({
      serviceProvider: 'local',
      lmStudioUrl: 'http://test',
      lmStudioModel: 'model',
      onToggleCollapse: onToggleCollapseMock
    });

    const saveButton = await screen.findByRole('button', { name: /Save & Test Configuration/i });
    await userEvent.click(saveButton);

    expect(await screen.findByText('Successfully connected to LM Studio server!')).toBeInTheDocument();
    expect(onToggleCollapseMock).toHaveBeenCalled();
  });
});