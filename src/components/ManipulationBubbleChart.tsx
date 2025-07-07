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

  // DEFINITIVE FIX: Create a smaller radius for the text container to ensure padding.
  const padding = radius * 0.15; // 15% padding from the edge
  const textRadius = radius - padding;

  // Font size now scales relative to the smaller text area
  const fontSize = Math.max(8, Math.min(textRadius * 0.4, 16));

  const textContainerStyle: React.CSSProperties = {
    color: 'white',
    fontSize: `${fontSize}px`,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    lineHeight: 1.1,
    wordBreak: 'break-word',
    textShadow: '0px 1px 2px rgba(0,0,0,0.5)',
  };

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <circle r={radius} fill={color} style={{ stroke: 'white', strokeWidth: 2, opacity: 0.95 }} />
      {/* The foreignObject is now smaller than the circle, creating the padding */}
      <foreignObject x={-textRadius} y={-textRadius} width={textRadius * 2} height={textRadius * 2}>
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

      const uniqueCategories = [...new Set(data.map(d => d.category))];
      const categoryCenters = new Map<string, {x: number, y: number}>();
      uniqueCategories.forEach((category, i) => {
        const x = (dimensions.width / (uniqueCategories.length + 1)) * (i + 1);
        categoryCenters.set(category, { x: x, y: dimensions.height / 2 });
      });

      const tacticCenters = new Map<string, {x: number, y: number}>();
      const uniqueNames = [...new Set(data.map(d => d.name))];
      uniqueNames.forEach(name => {
        const category = data.find(d => d.name === name)!.category;
        const categoryCenter = categoryCenters.get(category)!;
        tacticCenters.set(name, {
            x: categoryCenter.x + (Math.random() - 0.5) * 50,
            y: categoryCenter.y + (Math.random() - 0.5) * 50
        });
      });

      const simulation = d3.forceSimulation<SimulationNode>(nodes)
        .force('x', d3.forceX<SimulationNode>(d => tacticCenters.get(d.name)?.x ?? dimensions.width / 2).strength(0.4))
        .force('y', d3.forceY<SimulationNode>(d => tacticCenters.get(d.name)?.y ?? dimensions.height / 2).strength(0.4))
        .force('collide', d3.forceCollide<SimulationNode>().radius(d => d.radius + 2).strength(0.8))
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
              <Scatter data={simulatedData} shape={<CustomBubble />} isAnimationActive={false}/>
            </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ManipulationBubbleChart;