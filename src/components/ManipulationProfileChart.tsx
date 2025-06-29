// src/components/ManipulationProfileChart.tsx

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ManipulationProfileChartProps {
  data: { tactic: string; count: number }[];
  color: string;
  hasFindings: boolean;
}

const ManipulationProfileChart: React.FC<ManipulationProfileChartProps> = ({ data, color, hasFindings }) => {
  // Determine the color based on whether findings are present.
  const chartColor = hasFindings ? color : '#22c55e'; // Green-500 for "no findings"
  const fillColor = hasFindings ? color : '#bbf7d0'; // Green-200 for "no findings"

  // Radar charts need at least 3 points to render a shape.
  if (data.length < 3) {
    return null; // Don't render if the category has fewer than 3 tactics.
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow-md border border-gray-200">
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="tactic" fontSize="12px" />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 'auto']}
              tickFormatter={(tickValue) => `${tickValue - 1}`} // Show the real count (value - 1)
            />
            <Radar
              name="Count"
              dataKey="count"
              stroke={chartColor}
              fill={fillColor}
              fillOpacity={0.7}
            />
            <Tooltip
              formatter={(value: number) => [value - 1, 'Detected']} // Show the real count in tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ManipulationProfileChart;