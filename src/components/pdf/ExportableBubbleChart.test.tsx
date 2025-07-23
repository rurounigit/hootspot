// src/components/pdf/ExportableBubbleChart.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ExportableBubbleChart from './ExportableBubbleChart';

// Mock the d3 library to prevent errors in the JSDOM environment
// This mock simulates the chaining of d3-force functions
vi.mock('d3', async (importOriginal) => {
  const originalD3 = await importOriginal<typeof import('d3')>();
  return {
    ...originalD3,
    forceSimulation: () => ({
      force: vi.fn().mockReturnThis(),
      stop: vi.fn().mockReturnThis(),
      tick: vi.fn().mockReturnThis(),
    }),
  };
});


describe('ExportableBubbleChart', () => {
    const mockData = [
        { id: '1', name: 'Bubble 1', strength: 5, category: 'A', color: '#ff0000', radius: 20 },
        { id: '2', name: 'Bubble 2', strength: 8, category: 'B', color: '#00ff00', radius: 30 }
    ];

    it('renders an SVG element with the correct dimensions', () => {
        const { container } = render(<ExportableBubbleChart data={mockData} width={500} height={400} />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveAttribute('width', '500');
        expect(svg).toHaveAttribute('height', '400');
    });

    it('renders the correct number of circle elements', () => {
        const { container } = render(<ExportableBubbleChart data={mockData} width={500} height={400} />);
        const circles = container.querySelectorAll('circle');
        expect(circles).toHaveLength(mockData.length);
    });

    it('does not render if data is empty', () => {
        const { container } = render(<ExportableBubbleChart data={[]} width={500} height={400} />);
        const svg = container.querySelector('svg');
        expect(svg).not.toBeInTheDocument();
    });
});