// src/components/config/LMStudioConfig.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LMStudioConfig from './LMStudioConfig';
import { LanguageProvider } from '../../i18n';

describe('LMStudioConfig Component', () => {
  const defaultProps = {
    lmStudioUrl: '',
    onLmStudioUrlChange: vi.fn(),
    lmStudioModel: '',
    onLmStudioModelChange: vi.fn(),
  };

  const renderWithProvider = (props: Partial<typeof defaultProps> = {}) => {
    return render(
      <LanguageProvider>
        <LMStudioConfig {...defaultProps} {...props} />
      </LanguageProvider>
    );
  };

  it('calls onLmStudioUrlChange when user types in the URL field', async () => {
    const onLmStudioUrlChangeMock = vi.fn();
    renderWithProvider({ onLmStudioUrlChange: onLmStudioUrlChangeMock });

    const urlInput = screen.getByLabelText(/config_local_server_url_label/i);
    await userEvent.type(urlInput, 'http://localhost:1234');

    expect(onLmStudioUrlChangeMock).toHaveBeenCalled();
  });

  it('calls onLmStudioModelChange when user types in the model name field', async () => {
    const onLmStudioModelChangeMock = vi.fn();
    renderWithProvider({ onLmStudioModelChange: onLmStudioModelChangeMock });

    const modelInput = screen.getByLabelText(/config_local_model_name_label/i);
    await userEvent.type(modelInput, 'test-model');

    expect(onLmStudioModelChangeMock).toHaveBeenCalled();
  });
});