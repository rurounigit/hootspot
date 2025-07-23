// src/components/config/GoogleConfig.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GoogleConfig from './GoogleConfig';
import { LanguageProvider } from '../../i18n';

describe('GoogleConfig Component', () => {
  const defaultProps = {
    apiKeyInput: '',
    onApiKeyInputChange: vi.fn(),
    models: { preview: [], stable: [] },
    selectedModel: 'gemini-pro',
    onModelChange: vi.fn(),
    areModelsLoading: false,
    modelsError: null,
  };

  const renderWithProvider = (props = {}) => {
    return render(
      <LanguageProvider>
        <GoogleConfig {...defaultProps} {...props} />
      </LanguageProvider>
    );
  };

  it('calls onApiKeyInputChange when the user types in the API key field', async () => {
    const onApiKeyInputChangeMock = vi.fn();
    renderWithProvider({ onApiKeyInputChange: onApiKeyInputChangeMock });

    // Use findByLabelText which waits for async operations (like translation loading) to complete.
    const input = await screen.findByLabelText('Google Gemini API Key');
    await userEvent.type(input, 'my-secret-key');

    expect(onApiKeyInputChangeMock).toHaveBeenCalled();
  });

  it('renders model options when provided', async () => {
    const models = {
      preview: [{ name: 'preview-1', displayName: 'Preview Model', supportedGenerationMethods: ['generateContent'], version: '1.0' }],
      stable: [{ name: 'stable-1', displayName: 'Stable Model', supportedGenerationMethods: ['generateContent'], version: '1.0' }],
    };
    renderWithProvider({ models });

    // Use findByText to ensure we wait for the component to render the options.
    expect(await screen.findByText('Preview Model')).toBeInTheDocument();
    expect(await screen.findByText('Stable Model')).toBeInTheDocument();
  });
});