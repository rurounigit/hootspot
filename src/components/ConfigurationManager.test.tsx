import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; // Kept because it's used
import ConfigurationManager from './ConfigurationManager';
import { LanguageProvider } from '../i18n';

// Mock child components and api utils
vi.mock('../api/google/utils', () => ({
  testApiKey: vi.fn(),
}));
vi.mock('../api/lm-studio', () => ({
    testLMStudioConnection: vi.fn(),
}));
vi.mock('./config/GoogleConfig', () => ({
    default: (props: { apiKeyInput: string }) => <input data-testid="google-config" defaultValue={props.apiKeyInput} />,
}));
vi.mock('./config/LMStudioConfig', () => ({
    default: () => <div data-testid="lm-studio-config">LM Studio Config</div>,
}));

// Add a type for props
type ConfigurationManagerProps = React.ComponentProps<typeof ConfigurationManager>;

describe('ConfigurationManager', () => {
  const defaultProps: ConfigurationManagerProps = {
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

  const renderWithProvider = (props: Partial<ConfigurationManagerProps>) => {
    return render(
        <LanguageProvider>
            <ConfigurationManager {...defaultProps} {...props} />
        </LanguageProvider>
    );
  };

  it('renders Google config by default', () => {
    renderWithProvider({});
    expect(screen.getByTestId('google-config')).toBeInTheDocument();
    expect(screen.queryByTestId('lm-studio-config')).not.toBeInTheDocument();
  });

  it('switches to LM Studio config on button click', async () => {
    const onServiceProviderChange = vi.fn();
    renderWithProvider({ onServiceProviderChange });

    const localButton = screen.getByRole('button', { name: /config_provider_local/i });
    await userEvent.click(localButton);

    expect(onServiceProviderChange).toHaveBeenCalledWith('local');
  });

    it('displays a warning if collapsed and not configured', () => {
        renderWithProvider({ isCollapsed: true, isCurrentProviderConfigured: false });
        expect(screen.getByText('config_not_configured')).toBeInTheDocument();
    });

    it('displays a success message if collapsed and configured', () => {
        renderWithProvider({ isCollapsed: true, isCurrentProviderConfigured: true });
        expect(screen.getByText('config_is_configured')).toBeInTheDocument();
    });
});