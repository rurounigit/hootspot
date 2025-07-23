// src/components/config/GeneralSettings.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GeneralSettings from './GeneralSettings';
import { LanguageProvider } from '../../i18n';

// Mock the translation hook, as it's a dependency of the component.
vi.mock('../../i18n', async (importOriginal) => {
    const original = await importOriginal<typeof import('../../i18n')>()
    return {
        ...original,
        useTranslation: () => ({
            t: (key: string) => key, // Return the key itself for simplicity
        }),
    }
});

describe('GeneralSettings Component', () => {
  // Define a set of default props with mock functions (spies) for the handlers.
  // This allows us to check if they are called correctly.
  const defaultProps = {
    currentMaxCharLimit: 6000,
    onMaxCharLimitSave: vi.fn(),
    isNightMode: false,
    onNightModeChange: vi.fn(),
    includeRebuttalInJson: false,
    onIncludeRebuttalInJsonChange: vi.fn(),
    includeRebuttalInPdf: false,
    onIncludeRebuttalInPdfChange: vi.fn(),
  };

  // Helper function to render the component with the necessary provider
  const renderComponent = (props = {}) => {
    return render(
      <LanguageProvider>
        <GeneralSettings {...defaultProps} {...props} />
      </LanguageProvider>
    );
  };

  // Clear all mock history before each test to ensure a clean slate
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all settings controls correctly', () => {
    renderComponent();
    // Check that all the inputs and toggles are on the screen
    expect(screen.getByLabelText('config_max_chars_label')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'config_night_mode' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'config_include_rebuttal_json' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'config_include_rebuttal_pdf' })).toBeInTheDocument();
  });

  it('calls onMaxCharLimitSave when user types a new valid limit', async () => {
    renderComponent();
    const input = screen.getByLabelText('config_max_chars_label');

    // Simulate the user clearing the input and typing a new number
    await userEvent.clear(input);
    await userEvent.type(input, '5000');

    // Assert that our mock handler was called with the correct *numeric* value
    // This directly tests the logic in the handleMaxCharLimitChange function
    expect(defaultProps.onMaxCharLimitSave).toHaveBeenCalledWith(5000);
  });

  it('calls onNightModeChange with the correct value when toggle is clicked', async () => {
    // Render with night mode initially OFF
    renderComponent({ isNightMode: false });
    const toggle = screen.getByRole('button', { name: 'config_night_mode' });

    // Simulate a user click
    await userEvent.click(toggle);

    // Assert that the handler was called with TRUE, toggling the state
    expect(defaultProps.onNightModeChange).toHaveBeenCalledWith(true);
  });

  it('calls onIncludeRebuttalInJsonChange with the correct value when toggle is clicked', async () => {
    renderComponent({ includeRebuttalInJson: false });
    const toggle = screen.getByRole('button', { name: 'config_include_rebuttal_json' });

    await userEvent.click(toggle);

    expect(defaultProps.onIncludeRebuttalInJsonChange).toHaveBeenCalledWith(true);
  });

  it('calls onIncludeRebuttalInPdfChange with the correct value when toggle is clicked', async () => {
    renderComponent({ includeRebuttalInPdf: false });
    const toggle = screen.getByRole('button', { name: 'config_include_rebuttal_pdf' });

    await userEvent.click(toggle);

    expect(defaultProps.onIncludeRebuttalInPdfChange).toHaveBeenCalledWith(true);
  });
});