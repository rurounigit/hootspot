// src/components/ManipulationBubbleChart.tsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Customized } from 'recharts';
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
  onDimensionsChange: (dimensions: { width: number; height: number }) => void;
}

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

const ManipulationBubbleChart: React.FC<ManipulationBubbleChartProps> = ({ data, onDimensionsChange }) => {
  const { t } = useTranslation();
  const [simulatedData, setSimulatedData] = useState<SimulationNode[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [dynamicHeight, setDynamicHeight] = useState(350);

  const MAX_HEIGHT = 450;
  const MIN_HEIGHT = 300;
  const MAX_WIDTH = 500; // The width at which height is 450px
  const MIN_WIDTH = 250; // A reasonable minimum width for the side panel

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        if (entries && entries[0]) {
          const { width, height } = entries[0].contentRect;
          setDimensions({ width, height });
          onDimensionsChange({ width, height });
          // 1. Calculate the interpolation factor 't' (from 0.0 to 1.0)
          const range = MAX_WIDTH - MIN_WIDTH;
          const progress = Math.max(0, width - MIN_WIDTH); // Ensure progress isn't negative
          const t = Math.min(1, progress / range); // Clamp t between 0 and 1

          // 2. Apply the formula: newHeight = start + (end - start) * t
          const newHeight = MIN_HEIGHT + (MAX_HEIGHT - MIN_HEIGHT) * t;

          // 3. Set the new height in state
          setDynamicHeight(newHeight);
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [onDimensionsChange]);

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
        .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.1))
        .force('x', d3.forceX<SimulationNode>(d => tacticCenters.get(d.name)?.x ?? dimensions.width / 2).strength(0.2))
        .force('y', d3.forceY<SimulationNode>(d => tacticCenters.get(d.name)?.y ?? dimensions.height / 2).strength(0.2))
        .force('collide', d3.forceCollide<SimulationNode>().radius(d => d.radius + 2).strength(0.9))
        .stop();

      simulation.tick(300);
      setSimulatedData(nodes);
    }
  }, [data, dimensions]);


  if (!data || data.length === 0) {
      return null;
  }

 return (
    <div
      id="bubble-chart-container"
      ref={containerRef}
      className="bg-gray-50 p-2 rounded-lg shadow-md border border-gray-200"
      style={{ width: '100%', height: `${dynamicHeight}px` }}
    >
      {simulatedData.length > 0 && (
        <ResponsiveContainer>
          <ScatterChart>
            <XAxis type="number" dataKey="x" name="x" hide={true} domain={[0, dimensions.width]} />
            <YAxis type="number" dataKey="y" name="y" hide={true} domain={[0, dimensions.height]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip t={t} />} isAnimationActive={false} />

            {/*
              This is the key change. We use <Customized /> to render everything ourselves,
              ensuring perfect synchronization between hulls and bubbles.
            */}
            <Customized
              component={() => {
                const nodesByCategory = d3.group(simulatedData, d => d.category);

                return (
                  <g>
                    {/* First, render all the hulls in the background */}
                    {Array.from(nodesByCategory, ([category, nodes]) => (
                      <CategoryHull
                        key={`${category}-hull`}
                        nodes={nodes}
                        color={nodes[0].color}
                      />
                    ))}

                    {/* Second, render all the bubbles on top of the hulls */}
                    {simulatedData.map(node => {
                      const { x, y, radius, color, name } = node;
                      const padding = radius * 0.30;
                      const textRadius = radius - padding;
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
                        <g key={node.id} transform={`translate(${x}, ${y})`}>
                          <circle r={radius} fill={color} style={{ stroke: 'white', strokeWidth: 0, opacity: 0.95 }} />
                          <foreignObject x={-textRadius} y={-textRadius} width={textRadius * 2} height={textRadius * 2}>
                            <div style={textContainerStyle} xmlns="http://www.w3.org/1999/xhtml">
                              {name}
                            </div>
                          </foreignObject>
                        </g>
                      );
                    })}
                  </g>
                );
              }}
            />

            {/* The original <Scatter> component is now removed, as we are drawing the bubbles ourselves. */}

          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

interface CategoryHullProps {
  nodes: SimulationNode[];
  color: string;
}

const CategoryHull: React.FC<CategoryHullProps> = ({ nodes, color }) => {
  const padding = 15; // The space between the bubble and the hull

  const pathData = useMemo(() => {
    // --- Case 1: A single bubble ---
    // We draw a circular path to match the style of the other hulls.
    if (nodes.length === 1) {
      const node = nodes[0];
      const r = node.radius + padding;
      // This is the SVG path command for a circle.
      // M = Move to, m = relative move, a = arc, z = close path.
      return `M ${node.x}, ${node.y - r}
              a ${r},${r} 0 1,0 0,${r * 2}
              a ${r},${r} 0 1,0 0,-${r * 2}
              z`;
    }

    // --- Case 2 & 3: Two or more bubbles ---
    // The hull algorithm works perfectly for 2+ bubbles.
    if (nodes.length >= 2) {
      const points: [number, number][] = [];
      const numPointsOnCircle = 12;

      nodes.forEach(node => {
        for (let i = 0; i < numPointsOnCircle; i++) {
          const angle = (i / numPointsOnCircle) * 2 * Math.PI;
          const x = node.x! + (node.radius + padding) * Math.cos(angle);
          const y = node.y! + (node.radius + padding) * Math.sin(angle);
          points.push([x, y]);
        }
      });

      const hull = d3.polygonHull(points);
      if (!hull) return null; // Safeguard

      const lineGenerator = d3.line()
        .x(d => d[0])
        .y(d => d[1])
        .curve(d3.curveCatmullRomClosed.alpha(0.7));

      return lineGenerator(hull);
    }

    // If there are 0 nodes, do nothing.
    return null;

  }, [nodes]);

  if (!pathData) {
    return null;
  }

  // This single return statement now handles all cases (1, 2, or more bubbles)
  // because they all produce a valid SVG path string.
  return (
    <path
      d={pathData}
      fill={color}
      fillOpacity={0.15}
      stroke={color}
      strokeWidth={2}
      strokeOpacity={0.4}
      strokeLinejoin="round"
    />
  );
};

export default ManipulationBubbleChart;