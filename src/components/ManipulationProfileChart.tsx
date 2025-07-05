// src/components/ManipulationProfileChart.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from 'recharts';
import { useTranslation } from '../i18n';
import { LEXICON_SECTIONS_BY_KEY, keyToDescKeyMap } from '../lexicon-structure'; // Import keyToDescKeyMap

// Find the original simple key (e.g., GUILT_TRIPPING) from the translated short name.
// This is more robust than relying on the displayed name.
const findKeyByTranslatedTactic = (translatedTactic: string, t: (key: string) => string): string | null => {
  for (const sectionKey in LEXICON_SECTIONS_BY_KEY) {
    const section = LEXICON_SECTIONS_BY_KEY[sectionKey];
    for (const patternKey in section) {
      const i18nKey = section[patternKey];
      if (t(i18nKey) === translatedTactic) {
        return patternKey;
      }
    }
  }
  return null;
}

const CustomRadarTooltip = ({ active, payload, t }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    // The simpleKey is now passed directly in the payload for reliability.
    const simpleKey = data.payload.simpleKey;
    const tacticName = data.payload.tactic; // This is the already translated name.
    const realCount = data.value - 1;

    // FIX: Use the 'keyToDescKeyMap' for a reliable lookup instead of manual string construction.
    const descKey = keyToDescKeyMap.get(simpleKey);
    const description = descKey ? t(descKey) : '';

    return (
      <div className="max-w-xs p-3 bg-white border border-gray-300 rounded-lg shadow-xl text-sm pointer-events-none">
        <p className="font-bold text-gray-800">{tacticName}</p>
        <p style={{ color: data.stroke }}>{t('report_tooltip_detected', { count: realCount })}</p>
        {description && description !== descKey && <p className="mt-2 text-gray-600">{description}</p>}
      </div>
    );
  }
  return null;
};

// The tick component with soft hyphens is correct.
const CustomAngleTick = (props: any) => {
    const { x, y, payload, containerWidth } = props;
    const WRAP_BREAKPOINT = 380;
    const MAX_WIDTH = containerWidth < WRAP_BREAKPOINT ? 80 : 150;

    const formatLabel = (label: string): string => {
        let formatted = label.replace('/', '/\u00AD').replace('-', '-\u00AD');
        // Add hyphens for other languages if needed, e.g., German
        if (label.includes("Personalisierung")) {
           formatted = "Personali\u00ADsierung";
        }
        if (label.includes("Inkompetenz")) {
            formatted = "Inkompe\u00ADtenz";
        }
        return formatted;
    };

    const label = formatLabel(String(payload.value));

    return (
        <g transform={`translate(${x},${y})`}>
            <foreignObject x={-MAX_WIDTH / 2} y={-25} width={MAX_WIDTH} height={50}>
                <div
                    // @ts-ignore
                    xmlns="http://www.w3.org/1999/xhtml"
                    style={{
                        width: `${MAX_WIDTH}px`,
                        textAlign: 'center',
                        fontSize: '12px',
                        lineHeight: '1.2',
                        wordWrap: 'break-word',
                    }}
                    dangerouslySetInnerHTML={{ __html: label }}
                />
            </foreignObject>
        </g>
    );
};

interface ManipulationProfileChartProps {
  data: { tactic: string; count: number, simpleKey: string }[];
  color: string;
  hasFindings: boolean;
}

const ManipulationProfileChart: React.FC<ManipulationProfileChartProps> = ({ data, color, hasFindings }) => {
  const { t } = useTranslation();
  const [cursorPosition, setCursorPosition] = useState<{ x: number, y: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries && entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    if (chartContainerRef.current) {
      observer.observe(chartContainerRef.current);
    }
    return () => {
      if (chartContainerRef.current) {
        observer.unobserve(chartContainerRef.current);
      }
    };
  }, []);

  const chartColor = hasFindings ? color : '#22c55e';
  const fillColor = hasFindings ? color : '#bbf7d0';

  if (data.length < 3) return null;

  const handleMouseMove = (e: any) => {
    if (e.activeCoordinate) {
        setCursorPosition({ x: e.activeCoordinate.x, y: e.activeCoordinate.y });
    } else {
        setCursorPosition(null);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow-md border border-gray-200">
      <div ref={chartContainerRef} style={{ width: '100%', height: 300 }}>
        {containerWidth > 0 && (
          <RadarChart
            width={containerWidth}
            height={300}
            cx="50%"
            cy="50%"
            outerRadius="70%"
            data={data}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setCursorPosition(null)}
            isAnimationActive={false}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="tactic" tick={<CustomAngleTick containerWidth={containerWidth} />} />
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
              isAnimationActive={false}
            />
            <Tooltip
              position={cursorPosition ? { x: cursorPosition.x + 10, y: cursorPosition.y + 10 } : undefined}
              content={<CustomRadarTooltip t={t} />}
              cursor={false}
              isAnimationActive={false}
            />
          </RadarChart>
        )}
      </div>
    </div>
  );
};

export default ManipulationProfileChart;