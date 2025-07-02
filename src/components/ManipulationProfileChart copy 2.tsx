import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '../i18n';
import { shortNameToKeyMap, keyToDescKeyMap } from '../lexicon-structure';

// This is our custom component for the tooltip's content.
// Recharts passes it props like 'active' and 'payload' automatically.
const CustomRadarTooltip = ({ active, payload }: any) => {
  const { t } = useTranslation();

  if (active && payload && payload.length) {
    const data = payload[0];
    const tacticName = data.payload.tactic;
    const realCount = data.value - 1;

    // Look up the translation key for the pattern's description
    const simpleKey = shortNameToKeyMap.get(tacticName);
    const descKey = simpleKey ? keyToDescKeyMap.get(simpleKey) : null;
    const description = descKey ? t(descKey) : '';

    return (
      <div className="max-w-xs p-3 bg-white border border-gray-300 rounded-lg shadow-xl text-sm pointer-events-none">
        <p className="font-bold text-gray-800">{tacticName}</p>
        <p style={{ color: data.stroke }}>Detected: {realCount}</p>
        {description && <p className="mt-2 text-gray-600">{description}</p>}
      </div>
    );
  }

  return null;
};


interface ManipulationProfileChartProps {
  data: { tactic: string; count: number }[];
  color: string;
  hasFindings: boolean;
}

const ManipulationProfileChart: React.FC<ManipulationProfileChartProps> = ({ data, color, hasFindings }) => {
  // State to hold the current position of the mouse cursor, relative to the parent SVG container.
  const [cursorPosition, setCursorPosition] = useState<{ x: number, y: number } | null>(null);

  const chartColor = hasFindings ? color : '#22c55e';
  const fillColor = hasFindings ? color : '#bbf7d0';

  // Recharts can't draw a radar with fewer than 3 points.
  if (data.length < 3) {
    return null;
  }

  // This handler is called whenever the mouse moves over the chart.
  const handleMouseMove = (e: any) => {
    // The `e` object contains chart coordinates if a tooltip is active.
    // We only need to update our position state.
    // The `active` state of the tooltip itself is handled internally by Recharts.
    if (e.activeCoordinate) {
        setCursorPosition({ x: e.activeCoordinate.x, y: e.activeCoordinate.y });
    } else {
        setCursorPosition(null);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow-md border border-gray-200">
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="80%"
            data={data}
            // Add the mouse move handler to the chart.
            onMouseMove={handleMouseMove}
            // When the mouse leaves the chart, hide the tooltip.
            onMouseLeave={() => setCursorPosition(null)}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="tactic" fontSize="12px" />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 'auto']}
              tickFormatter={(tickValue) => `${tickValue - 1}`}
            />
            <Radar
              name="Count"
              dataKey="count"
              stroke={chartColor}
              fill={fillColor}
              fillOpacity={0.7}
            />

            {/*
              The native Tooltip component is used here for stability.
              - `position`: We pass our state here to control placement. We add an offset (e.g., +10) to prevent the tooltip from flickering by being directly under the mouse.
              - `content`: This tells Recharts to use our custom React component for the tooltip's body.
              - `cursor={false}`: This hides the default dot or line that Recharts shows at the active coordinate.
              - `isAnimationActive={false}`: This makes the tooltip appear and disappear instantly, which feels more responsive for mouse-based positioning.
            */}
            <Tooltip
              position={cursorPosition ? { x: cursorPosition.x + 10, y: cursorPosition.y + 10 } : undefined}
              content={<CustomRadarTooltip />}
              cursor={false}
              isAnimationActive={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ManipulationProfileChart;