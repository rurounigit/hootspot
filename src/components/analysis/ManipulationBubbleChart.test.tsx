// src/components/analysis/ManipulationBubbleChart.test.tsx

import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ManipulationBubbleChart from './ManipulationBubbleChart';
import { LanguageProvider } from '../../i18n';

// FIX: Make the mock dynamic. It now returns the text that was passed to it.
vi.mock('../../utils/textUtils', () => ({
  calculateOptimalFontSize: (text: string) => ({ fontSize: 10, lines: [text] }),
}));

// Mock ResizeObserver to immediately provide dimensions
const mockResizeObserver = vi.fn((callback) => ({
  observe: () => {
    callback([{ contentRect: { width: 500, height: 350 } }]);
  },
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', mockResizeObserver);


describe('ManipulationBubbleChart Component', () => {
  const mockChartData = [
    { id: 'finding-1', name: 'Ad Hominem', strength: 8, category: 'Test', color: '#ff0000', radius: 40 },
    { id: 'finding-2', name: 'Straw Man', strength: 6, category: 'Test', color: '#00ff00', radius: 30 }
  ];

  const defaultProps = {
    onDimensionsChange: vi.fn(),
    onBubbleClick: vi.fn(),
    activeFindingId: null
  };

  const renderWithProvider = (props: any) => {
    return render(
      <LanguageProvider>
        <ManipulationBubbleChart {...defaultProps} {...props} />
      </LanguageProvider>
    );
  };

  it('renders SVG circle elements when provided with data', () => {
    const { container } = renderWithProvider({ data: mockChartData });

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    const circles = svg!.querySelectorAll('circle');
    expect(circles).toHaveLength(mockChartData.length);
  });

  it('renders no circle elements when data array is empty', () => {
    const { container } = renderWithProvider({ data: [] });

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    const circles = svg!.querySelectorAll('circle');
    expect(circles).toHaveLength(0);
  });

  it('calls onBubbleClick with the correct finding ID when a bubble is clicked', async () => {
    const onBubbleClickMock = vi.fn();
    const { container } = renderWithProvider({ data: mockChartData, onBubbleClick: onBubbleClickMock });

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Now that the mock is dynamic, this will successfully find the element
    const bubbleGroups = svg!.querySelectorAll('g');
    const firstBubbleGroup = Array.from(bubbleGroups).find(g => g.textContent === 'Ad Hominem');
    expect(firstBubbleGroup).toBeInTheDocument();

    await userEvent.click(firstBubbleGroup!);

    expect(onBubbleClickMock).toHaveBeenCalledTimes(1);
    expect(onBubbleClickMock).toHaveBeenCalledWith('finding-1');
  });
});