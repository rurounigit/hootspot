import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useTranslation } from '../i18n';
import { shortNameToKeyMap, keyToDescKeyMap } from '../lexicon-structure';

// This component is stable and now correctly reads the flat payload object.
const CustomRadarTooltipContent = ({ active, payload, t }: any) => {
    if (active && payload) {
        const tacticName = payload.tactic || "Unknown Tactic";
        const realCount = (typeof payload.count === 'number') ? payload.count - 1 : 0;
        // The color is now passed in a 'color' property on the payload.
        const color = payload.color || '#8884d8';

        const simpleKey = shortNameToKeyMap.get(tacticName);
        const descKey = simpleKey ? keyToDescKeyMap.get(simpleKey) : null;
        const description = descKey ? t(descKey) : '';

        return (
            <div className="max-w-xs p-3 bg-white border border-gray-300 rounded-lg shadow-xl text-sm">
                <p className="font-bold text-gray-800">{tacticName}</p>
                <p style={{ color: color }}>Detected: {realCount}</p>
                {description && <p className="mt-2 text-gray-600">{description}</p>}
            </div>
        );
    }
    return null;
};

// This component for wrapped labels is stable.
const CustomAngleTick = (props: any) => {
    const { x, y, payload } = props;
    const label = String(payload.value);
    const MAX_WIDTH = 85;

    return (
        <g transform={`translate(${x},${y})`}>
            <foreignObject x={-MAX_WIDTH / 2} y={-30} width={MAX_WIDTH} height={60}>
                {/* @ts-ignore - This is a necessary attribute for SVG foreignObject to render HTML */}
                <div
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
    const { t } = useTranslation();
    const [tooltipState, setTooltipState] = useState({
        visible: false,
        payload: null as any,
        coordinate: { x: 0, y: 0 }
    });

    const chartColor = hasFindings ? color : '#22c55e';
    const fillColor = hasFindings ? color : '#bbf7d0';

    if (data.length < 3) {
        return null;
    }

    // This handler tracks the mouse position over the entire chart area.
    const handleChartMouseMove = (chartState: any) => {
        // We only need to update the coordinates if a tooltip is already active.
        if (chartState.activeTooltipIndex !== undefined && tooltipState.visible) {
             setTooltipState(prevState => ({ ...prevState, coordinate: { x: chartState.chartX, y: chartState.chartY } }));
        }
    };

    // This handler hides the tooltip when the mouse leaves the chart area.
    const handleChartMouseLeave = () => {
        setTooltipState(prevState => ({ ...prevState, visible: false }));
    };

    // CORRECTED: This handler now uses the direct, top-level object from the event.
    const handleRadarMouseEnter = (data: any, index: number, e: React.MouseEvent<SVGElement>) => {
        setTooltipState({
            visible: true,
            // Construct the payload by combining the hovered data with the line color.
            payload: {
                ...data,
                color: chartColor
            },
            coordinate: { x: e.clientX, y: e.clientY }
        });
    };

    const handleRadarMouseLeave = () => {
         setTooltipState(prevState => ({ ...prevState, visible: false }));
    };


    return (
        <div className="bg-gray-50 p-4 rounded-lg shadow-md border border-gray-200 relative">
            {/* The custom tooltip div, controlled by state */}
            {tooltipState.visible && (
                <div style={{
                    position: 'fixed',
                    left: tooltipState.coordinate.x + 15,
                    top: tooltipState.coordinate.y + 15,
                    pointerEvents: 'none',
                    zIndex: 1000,
                }}>
                    <CustomRadarTooltipContent active={true} payload={tooltipState.payload} t={t} />
                </div>
            )}

            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    {/* The onMouseMove and onMouseLeave events are now on the chart itself */}
                    <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="70%"
                        data={data}
                        margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
                        onMouseMove={handleChartMouseMove}
                        onMouseLeave={handleChartMouseLeave}
                    >
                        <PolarGrid />
                        <PolarAngleAxis dataKey="tactic" tick={<CustomAngleTick />} />
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
                            onMouseEnter={handleRadarMouseEnter}
                            onMouseLeave={handleRadarMouseLeave}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ManipulationProfileChart;