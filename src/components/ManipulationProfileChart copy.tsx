import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '../i18n';
import { shortNameToKeyMap, keyToDescKeyMap } from '../lexicon-structure';

// Custom Tooltip Component for the Radar Chart
const CustomRadarTooltip = ({ active, payload }: any) => {
  const { t } = useTranslation();

  if (active && payload && payload.length) {
    const data = payload[0];
    const tacticName = data.payload.tactic;
    const realCount = data.value - 1;

    // Look up the description using the robust maps
    const simpleKey = shortNameToKeyMap.get(tacticName);
    const descKey = simpleKey ? keyToDescKeyMap.get(simpleKey) : null;
    const description = descKey ? t(descKey) : '';

    return (
      <div className="max-w-xs p-3 bg-white border border-gray-300 rounded-lg shadow-xl text-sm">
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
  const chartColor = hasFindings ? color : '#22c55e';
  const fillColor = hasFindings ? color : '#bbf7d0';

  if (data.length < 3) {
    return null;
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
              tickFormatter={(tickValue) => `${tickValue - 1}`}
            />
            <Radar
              name="Count"
              dataKey="count"
              stroke={chartColor}
              fill={fillColor}
              fillOpacity={0.7}
            />
            {/* Use the new custom tooltip */}
            <Tooltip content={<CustomRadarTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ManipulationProfileChart;