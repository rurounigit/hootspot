import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShareMenu from './ShareMenu';
import * as PdfHook from '../../hooks/usePdfGenerator';
import { LanguageProvider } from '../../i18n';

// Mock the hook and chrome API
vi.mock('../../hooks/usePdfGenerator');
const generatePdfMock = vi.fn();
vi.mocked(PdfHook.usePdfGenerator).mockReturnValue({
  isGenerating: false,
  generatePdf: generatePdfMock,
});

describe('ShareMenu', () => {
  // Define a type for the component's props
  type ShareMenuProps = React.ComponentProps<typeof ShareMenu>;

  const defaultProps: ShareMenuProps = {
    analysis: { analysis_summary: 'summary', findings: [] },
    sourceText: 'text',
    highlightData: [],
    patternColorMap: new Map(),
    bubbleChartData: [],
    rebuttal: null,
    includeRebuttalInJson: false,
    includeRebuttalInPdf: false,
  };

  // Add the correct type for the 'props' parameter
  const renderWithProvider = (props: Partial<ShareMenuProps>) => {
    return render(
        <LanguageProvider>
            <ShareMenu {...defaultProps} {...props} />
        </LanguageProvider>
    );
  };

  it('opens the menu on click', async () => {
    renderWithProvider({});
    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    const shareButton = screen.getByRole('button', { name: /share_menu_tooltip/i });
    await userEvent.click(shareButton);

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'share_menu_pdf' })).toBeInTheDocument();
  });

  it('calls generatePdf when the PDF download button is clicked', async () => {
    renderWithProvider({});
    const shareButton = screen.getByRole('button', { name: /share_menu_tooltip/i });
    await userEvent.click(shareButton);

    const pdfButton = screen.getByRole('button', { name: 'share_menu_pdf' });
    await userEvent.click(pdfButton);

    expect(generatePdfMock).toHaveBeenCalled();
  });

  it('triggers a JSON download when the JSON download button is clicked', async () => {
    renderWithProvider({});
    const shareButton = screen.getByRole('button', { name: /share_menu_tooltip/i });
    await userEvent.click(shareButton);

    const jsonButton = screen.getByRole('button', { name: 'share_menu_json' });
    await userEvent.click(jsonButton);

    // Correctly assert against the globally mocked chrome object from setup.ts
    expect(chrome.downloads.download).toHaveBeenCalled();
  });
});