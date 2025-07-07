// src/components/ManipulationBubbleChart.tsx
import React, { useEffect, useState, useRef } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '../i18n';
import * as d3 from 'd3';

// Data received from parent
interface BubbleData {
  id: string;
  name: string;
  strength: number;
  category: string;
  color: string;
  radius: number; // The visual radius, calculated in the parent
}

// Data after D3 calculates its position
interface SimulationNode extends BubbleData, d3.SimulationNodeDatum {}

interface ManipulationBubbleChartProps {
  data: BubbleData[];
}

// The custom shape for each bubble, which includes the circle and the text
const CustomBubble = (props: any) => {
  const { cx, cy, payload } = props;
  const { color, radius, name } = payload as SimulationNode;

  // Style for the text container inside the bubble
  const textContainerStyle: React.CSSProperties = {
    color: 'white',
    fontSize: '12px',
    textAlign: 'center',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    boxSizing: 'border-box',
    overflow: 'hidden',
    lineHeight: 1.2,
  };

  return (
    // We use a <g> element to group the circle and its label
    <g transform={`translate(${cx}, ${cy})`}>
      <circle r={radius} fill={color} style={{ stroke: 'white', strokeWidth: 2, opacity: 0.9 }} />
      {/* foreignObject allows us to use HTML/CSS for complex text rendering inside SVG */}
      <foreignObject x={-radius} y={-radius} width={radius * 2} height={radius * 2}>
        <div style={textContainerStyle} xmlns="http://www.w3.org/1999/xhtml">
          {name}
        </div>
      </foreignObject>
    </g>
  );
};

const CustomTooltip = ({ active, payload, t }: any) => {
  if (active && payload && payload[0]) {
    const data = payload[0].payload as SimulationNode;
    return (
      <div className="p-3 bg-white border border-gray-300 rounded-lg shadow-xl text-sm">
        <p className="font-bold text-gray-800">{data.name}</p>
        <p style={{ color: data.color }}>{t('report_profile_strength')}: {data.strength}</p>
        <p className="text-gray-600">{t('report_profile_category')}: {t(data.category)}</p>
      </div>
    );
  }
  return null;
};

const ManipulationBubbleChart: React.FC<ManipulationBubbleChartProps> = ({ data }) => {
  const { t } = useTranslation();
  const [simulatedData, setSimulatedData] = useState<SimulationNode[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        if (entries && entries[0]) {
          const { width, height } = entries[0].contentRect;
          setDimensions({ width, height });
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  useEffect(() => {
    if (data && data.length > 0 && dimensions.width > 0) {
      const nodes: SimulationNode[] = data.map(d => ({ ...d }));

      const simulation = d3.forceSimulation<SimulationNode>(nodes)
        .force('x', d3.forceX(dimensions.width / 2).strength(0.05))
        .force('y', d3.forceY(dimensions.height / 2).strength(0.05))
        // The D3 collision force now uses the exact radius we calculated
        .force('collide', d3.forceCollide().radius((d: SimulationNode) => d.radius + 2).strength(1)) // +2 for padding
        .stop();

      simulation.tick(300);
      setSimulatedData(nodes);
    }
  }, [data, dimensions]);


  if (!data || data.length === 0) {
      return null;
  }

  return (
    <div id="bubble-chart-container" ref={containerRef} className="bg-gray-50 p-2 rounded-lg shadow-md border border-gray-200" style={{ width: '100%', height: 350 }}>
      {simulatedData.length > 0 && (
        <ResponsiveContainer>
            <ScatterChart>
              <XAxis type="number" dataKey="x" name="x" hide={true} domain={[0, dimensions.width]} />
              <YAxis type="number" dataKey="y" name="y" hide={true} domain={[0, dimensions.height]} />

              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip t={t} />} isAnimationActive={false}/>

              {/* We now use the `shape` prop to render our custom bubble */}
              <Scatter data={simulatedData} shape={<CustomBubble />} isAnimationActive={false}/>
            </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ManipulationBubbleChart;