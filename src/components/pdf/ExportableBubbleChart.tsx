// src/components/pdf/ExportableBubbleChart.tsx

import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { calculateOptimalFontSize } from '../../utils/textUtils';
import { PDF_CHART_CONFIG } from '../../config/chart';

// --- INTERFACES ---
interface BubbleData {
  id: string; name: string; strength: number; category: string; color: string; radius: number;
}
interface SimulationNode extends BubbleData, d3.SimulationNodeDatum {}
interface CategoryHullProps {
  nodes: SimulationNode[]; color: string;
}
interface ExportableBubbleChartProps {
  data: BubbleData[];
  width: number;
  height: number;
}

// --- Simplified Hull for Export ---
const CategoryHull: React.FC<CategoryHullProps> = ({ nodes, color }) => {
  const padding = 15;
  const pathData = useMemo(() => {
    if (nodes.length < 1) return null;
    if (nodes.length === 1) {
      const node = nodes[0];
      const r = node.radius + padding;
      return `M ${node.x!},${node.y! - r} a ${r},${r} 0 1,0 0,${r * 2} a ${r},${r} 0 1,0 0,-${r * 2} z`;
    }
    const points: [number, number][] = nodes.flatMap(node => {
        const p: [number, number][] = [];
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * 2 * Math.PI;
            p.push([node.x! + (node.radius + padding) * Math.cos(angle), node.y! + (node.radius + padding) * Math.sin(angle)]);
        }
        return p;
    });
    const hull = d3.polygonHull(points);
    if (!hull) return null;
    return d3.line().x(d => d[0]).y(d => d[1]).curve(d3.curveCatmullRomClosed.alpha(0.7))(hull);
  }, [nodes]);
  if (!pathData) return null;
  return <path d={pathData} fill={color} fillOpacity={0.15} stroke={color}
    strokeWidth={PDF_CHART_CONFIG.HULL_BORDER_SIZE}
    strokeOpacity={0.4} strokeLinejoin="round" />;
};

// --- EXPORT-ONLY BUBBLE CHART COMPONENT ---
const ExportableBubbleChart: React.FC<ExportableBubbleChartProps> = ({ data, width, height }) => {
  const simulatedData = useMemo<SimulationNode[]>(() => {
    if (!data || data.length === 0 || width === 0) return [];
    const nodes: SimulationNode[] = data.map(d => ({ ...d, x: Math.random() * width, y: Math.random() * height }));
    const uniqueCategories = [...new Set(data.map(d => d.category))];
    const categoryCenters = new Map<string, {x: number, y: number}>();
    uniqueCategories.forEach((category, i) => {
      categoryCenters.set(category, { x: (width / (uniqueCategories.length + 1)) * (i + 1), y: height / 2 });
    });
    const tacticCenters = new Map<string, {x: number, y: number}>();
    [...new Set(data.map(d => d.name))].forEach(name => {
      const category = data.find(d => d.name === name)!.category;
      const categoryCenter = categoryCenters.get(category)!;
      tacticCenters.set(name, { x: categoryCenter.x + (Math.random() - 0.5) * 50, y: categoryCenter.y + (Math.random() - 0.5) * 50 });
    });
    const simulation = d3.forceSimulation<SimulationNode>(nodes)
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.1))
      .force('x', d3.forceX<SimulationNode>(d => tacticCenters.get(d.name)?.x ?? width / 2).strength(0.2))
      .force('y', d3.forceY<SimulationNode>(d => tacticCenters.get(d.name)?.y ?? height / 2).strength(0.2))
      .force('collide', d3.forceCollide<SimulationNode>().radius(d => d.radius + 2).strength(0.9))
      .stop();
    simulation.tick(300);
    return nodes;
  }, [data, width, height]);

  const transform = useMemo(() => {
    if (simulatedData.length === 0) return '';
    const PADDING = PDF_CHART_CONFIG.CHART_ZOOM_PADDING;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    simulatedData.forEach(node => {
      minX = Math.min(minX, node.x! - node.radius);
      maxX = Math.max(maxX, node.x! + node.radius);
      minY = Math.min(minY, node.y! - node.radius);
      maxY = Math.max(maxY, node.y! + node.radius);
    });
    const dataWidth = maxX - minX;
    const dataHeight = maxY - minY;
    if (dataWidth === 0 || dataHeight === 0) return '';
    const scaleX = (width - PADDING * 2) / dataWidth;
    const scaleY = (height - PADDING * 2) / dataHeight;
    const scale = Math.min(scaleX, scaleY);
    const dataCenterX = minX + dataWidth / 2;
    const dataCenterY = minY + dataHeight / 2;
    const translateX = (width / 2) - (dataCenterX * scale);
    const translateY = (height / 2) - (dataCenterY * scale);
    return `translate(${translateX}, ${translateY}) scale(${scale})`;
  }, [simulatedData, width, height]);

  if (simulatedData.length === 0) return null;

  const nodesByCategory = d3.group(simulatedData, d => d.category);

  return (
    <svg width={width} height={height}>
      <g transform={transform}>
        {Array.from(nodesByCategory, ([category, nodes]) => (
          <CategoryHull key={category} nodes={nodes} color={nodes[0].color} />
        ))}
        {simulatedData.map((node) => {
          const { x, y, radius, color, name, id } = node;

          const { fontSize, lines } = calculateOptimalFontSize(name, radius, {
            minFont: PDF_CHART_CONFIG.BUBBLE_MIN_FONT_SIZE,
            maxFontSize: PDF_CHART_CONFIG.BUBBLE_MAX_FONT_SIZE,
            paddingFactor: PDF_CHART_CONFIG.BUBBLE_TEXT_PADDING_FACTOR,
          });

          return (
            <g key={id} transform={`translate(${x}, ${y})`}>
              <circle r={radius} fill={color} />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                style={{ fontSize: `${fontSize}px`, fontWeight: 'bold', pointerEvents: 'none' }}
              >
                {lines.map((line, index, arr) => (
                  <tspan
                    key={index}
                    x={0}
                    dy={index === 0 ? `-${(arr.length - 1) * 0.55}em` : '1.1em'}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export default ExportableBubbleChart;
