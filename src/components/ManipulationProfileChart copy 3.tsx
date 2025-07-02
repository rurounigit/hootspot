import React, { useState, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from 'recharts';
import { useTranslation } from '../i18n';
import { shortNameToKeyMap, keyToDescKeyMap } from '../lexicon-structure';

// The Tooltip content component remains correct.
const CustomRadarTooltip = ({ active, payload }: any) => {
  const { t } = useTranslation();
  if (active && payload && payload.length) {
    const data = payload[0];
    const tacticName = data.payload.tactic;
    const realCount = data.value - 1;
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

// FINAL VERSION: This tick component is now fully dynamic and wraps intelligently.
const CustomAngleTick = (props: any) => {
    const { x, y, payload, containerWidth } = props;

    // A breakpoint to decide when to wrap. Adjust if needed.
    const WRAP_BREAKPOINT = 380;
    // Set a max-width for the label container ONLY when the chart is small.
    const MAX_WIDTH = containerWidth < WRAP_BREAKPOINT ? 80 : 150;

    // Trick for intelligent wrapping: add a space after a slash to make it a valid line-break point for the browser.
    const label = String(payload.value).replace('/', '/ ');

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
                        color: '#666'
                    }}
                >
                    {label}
                </div>
            </foreignObject>
        </g>
    );
};


interface ManipulationProfileChartProps {
  data: { tactic: string; count: number }[];
  color: string;
  hasFindings: boolean;
}

const ManipulationProfileChart: React.FC<ManipulationProfileChartProps> = ({ data, color, hasFindings }) => {
  const [cursorPosition, setCursorPosition] = useState<{ x: number, y: number } | null>(null);

  // State to hold the dynamic width, and a ref to the container div.
  const [containerWidth, setContainerWidth] = useState(0);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  // This effect uses a ResizeObserver to get the real-time width of the container,
  // making this component truly responsive.
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

  if (data.length < 3) {
    return null;
  }

  const handleMouseMove = (e: any) => {
    if (e.activeCoordinate) {
        setCursorPosition({ x: e.activeCoordinate.x, y: e.activeCoordinate.y });
    } else {
        setCursorPosition(null);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow-md border border-gray-200">
      {/* This div is our responsive container, watched by the ResizeObserver. */}
      <div ref={chartContainerRef} style={{ width: '100%', height: 300 }}>
        {/* We only render the chart if we have a valid width, preventing errors on the initial render. */}
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
            />
            <Tooltip
              position={cursorPosition ? { x: cursorPosition.x + 10, y: cursorPosition.y + 10 } : undefined}
              content={<CustomRadarTooltip />}
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