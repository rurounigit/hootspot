// src/components/analysis/ManipulationBubbleChart.tsx

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslation } from '../../i18n';
import * as d3 from 'd3';
import { calculateOptimalFontSize } from '../../utils/textUtils';
import { UI_CHART_CONFIG } from '../../config/chart';

// --- INTERFACES ---
interface BubbleData {
  id: string; name: string; strength: number; category: string; color: string; radius: number;
}
interface SimulationNode extends BubbleData, d3.SimulationNodeDatum {}
interface ManipulationBubbleChartProps {
  data: BubbleData[];
  onDimensionsChange: (dimensions: { width: number; height: number }) => void;
  onBubbleClick: (findingId: string) => void;
  activeFindingId: string | null;
}

// --- CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload, t, coordinate }: any) => {
  if (active && payload && payload[0] && coordinate) {
    const data = payload[0];
    return (
      <div
        className="p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl text-sm pointer-events-none"
        style={{ position: 'fixed', top: coordinate.y, left: coordinate.x, zIndex: 1000, transform: 'translate(10px, 10px)' }}
      >
        <p className="font-bold text-gray-800 dark:text-gray-100" style={{ color: data.color }}>{data.name}</p>
        <p className="text-gray-600 dark:text-gray-400">{t('report_profile_strength')}: {data.strength}</p>
        <p className="text-gray-600 dark:text-gray-400">{t('report_profile_category')}: {t(data.category)}</p>
      </div>
    );
  }
  return null;
};

// --- CUSTOM HULL ---
interface CategoryHullProps {
  nodes: SimulationNode[]; color: string; onMouseOver: (e: React.MouseEvent) => void; onMouseLeave: () => void;
}
const CategoryHull: React.FC<CategoryHullProps> = ({ nodes, color, onMouseOver, onMouseLeave }) => {
  const padding = 15;
  const pathData = useMemo(() => {
    if (nodes.length < 1) return null;
    if (nodes.length === 1) {
      const node = nodes[0];
      const r = node.radius + padding;
      return `M ${node.x!}, ${node.y! - r} a ${r},${r} 0 1,0 0,${r * 2} a ${r},${r} 0 1,0 0,-${r * 2} z`;
    }
    const points: [number, number][] = [];
    nodes.forEach(node => {
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * 2 * Math.PI;
        points.push([node.x! + (node.radius + padding) * Math.cos(angle), node.y! + (node.radius + padding) * Math.sin(angle)]);
      }
    });
    const hull = d3.polygonHull(points);
    if (!hull) return null;
    return d3.line().x(d => d[0]).y(d => d[1]).curve(d3.curveCatmullRomClosed.alpha(0.7))(hull);
  }, [nodes]);
  if (!pathData) return null;
  return <path d={pathData} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={UI_CHART_CONFIG.HULL_BORDER_SIZE} strokeOpacity={0.4} strokeLinejoin="round" onMouseOver={onMouseOver} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }} />;
};


// --- MAIN BUBBLE CHART COMPONENT ---
const ManipulationBubbleChart: React.FC<ManipulationBubbleChartProps> = ({
  data, onDimensionsChange, onBubbleClick, activeFindingId,
}) => {
  const { t } = useTranslation();
  const [simulatedData, setSimulatedData] = useState<SimulationNode[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [dynamicHeight, setDynamicHeight] = useState(350);
  const [tooltipState, setTooltipState] = useState<{
    active: boolean; payload: any; coordinate: { x: number; y: number };
  } | null>(null);

  const MAX_HEIGHT = 450; const MIN_HEIGHT = 250; const MAX_WIDTH = 500; const MIN_WIDTH = 250;

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        if (entries && entries[0]) {
          const { width, height } = entries[0].contentRect;
          setDimensions({ width, height });
          onDimensionsChange({ width, height });
          const range = MAX_WIDTH - MIN_WIDTH;
          const progress = Math.max(0, width - MIN_WIDTH);
          const t = Math.min(1, progress / range);
          setDynamicHeight(MIN_HEIGHT + (MAX_HEIGHT - MIN_HEIGHT) * t);
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [onDimensionsChange]);

  useEffect(() => {
    if (data && data.length > 0 && dimensions.width > 0) {
      const nodes: SimulationNode[] = data.map(d => ({ ...d, x: Math.random() * dimensions.width, y: Math.random() * dimensions.height }));
      const uniqueCategories = [...new Set(data.map(d => d.category))];
      const categoryCenters = new Map<string, {x: number, y: number}>();
      uniqueCategories.forEach((category, i) => {
        categoryCenters.set(category, { x: (dimensions.width / (uniqueCategories.length + 1)) * (i + 1), y: dimensions.height / 2 });
      });
      const tacticCenters = new Map<string, {x: number, y: number}>();
      [...new Set(data.map(d => d.name))].forEach(name => {
        const category = data.find(d => d.name === name)!.category;
        const categoryCenter = categoryCenters.get(category)!;
        tacticCenters.set(name, { x: categoryCenter.x + (Math.random() - 0.5) * 50, y: categoryCenter.y + (Math.random() - 0.5) * 50 });
      });
      const simulation = d3.forceSimulation<SimulationNode>(nodes)
        .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.1))
        .force('x', d3.forceX<SimulationNode>(d => tacticCenters.get(d.name)?.x ?? dimensions.width / 2).strength(0.2))
        .force('y', d3.forceY<SimulationNode>(d => tacticCenters.get(d.name)?.y ?? dimensions.height / 2).strength(0.2))
        .force('collide', d3.forceCollide<SimulationNode>().radius(d => d.radius + 2).strength(0.9))
        .stop();
      simulation.tick(300);
      setSimulatedData(nodes);
    } else {
      setSimulatedData([]);
    }
  }, [data, dimensions]);

  const viewBox = useMemo(() => {
    if (!simulatedData || simulatedData.length === 0) {
      return `0 0 ${dimensions.width} ${dimensions.height}`;
    }

    const HULL_PADDING = 15;
    const ZOOM_PADDING = UI_CHART_CONFIG.VIEWBOX_ZOOM_PADDING;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    simulatedData.forEach(node => {
      minX = Math.min(minX, node.x! - node.radius - HULL_PADDING);
      maxX = Math.max(maxX, node.x! + node.radius + HULL_PADDING);
      minY = Math.min(minY, node.y! - node.radius - HULL_PADDING);
      maxY = Math.max(maxY, node.y! + node.radius + HULL_PADDING);
    });

    const dataWidth = maxX - minX;
    const dataHeight = maxY - minY;

    const finalMinX = minX - ZOOM_PADDING;
    const finalMinY = minY - ZOOM_PADDING;
    const finalWidth = dataWidth + (ZOOM_PADDING * 2);
    const finalHeight = dataHeight + (ZOOM_PADDING * 2);

    return `${finalMinX} ${finalMinY} ${finalWidth} ${finalHeight}`;
  }, [simulatedData, dimensions.width, dimensions.height]);

  const nodesByCategory = d3.group(simulatedData, d => d.category);

  return (
    <div id="bubble-chart-container" ref={containerRef} className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 focus:outline-none" style={{ width: '100%', height: `${dynamicHeight}px`, position: 'relative', overflow: 'hidden' }} tabIndex={-1}>
      <svg width={dimensions.width} height={dimensions.height} viewBox={viewBox}>
        <g>
          {Array.from(nodesByCategory, ([category, nodes]) => (
            <CategoryHull
              key={`${category}-hull`}
              nodes={nodes}
              color={nodes[0].color}
              onMouseOver={(e) => setTooltipState({ active: true, payload: [{ name: t(category), category: t(category), strength: `(${nodes.length} items)` }], coordinate: { x: e.clientX, y: e.clientY } })}
              onMouseLeave={() => setTooltipState(null)}
            />
          ))}
          {simulatedData.map((node: SimulationNode) => {
            const { x, y, radius, color, name, id } = node;
            const isActive = activeFindingId === id;
            const strokeStyle = isActive ? { stroke: '#2563eb', strokeWidth: UI_CHART_CONFIG.ACTIVE_BUBBLE_STROKE_WIDTH, strokeOpacity: 1 } : { stroke: 'white', strokeWidth: 0, opacity: 0.95 };

            const { fontSize, lines } = calculateOptimalFontSize(name, radius, {
              minFont: UI_CHART_CONFIG.BUBBLE_MIN_FONT_SIZE,
              maxFontSize: UI_CHART_CONFIG.BUBBLE_MAX_FONT_SIZE,
              paddingFactor: UI_CHART_CONFIG.BUBBLE_TEXT_PADDING_FACTOR,
            });

            return (
              <g
                key={id}
                transform={`translate(${x}, ${y})`}
                style={{ cursor: 'pointer' }}
                onMouseOver={(e) => setTooltipState({ active: true, payload: [node], coordinate: { x: e.clientX, y: e.clientY } })}
                onMouseLeave={() => setTooltipState(null)}
                onClick={(e) => { e.stopPropagation(); onBubbleClick(id); }}
              >
                <circle r={radius} fill={color} style={{ ...strokeStyle, transition: 'all 0.2s ease-in-out' }} />

                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  style={{ fontSize: `${fontSize}px`, fontWeight: 'bold', pointerEvents: 'none', textShadow: UI_CHART_CONFIG.BUBBLE_TEXT_SHADOW }}
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
      <CustomTooltip
        t={t}
        active={tooltipState?.active}
        payload={tooltipState?.payload}
        coordinate={tooltipState?.coordinate}
      />
    </div>
  );
};

export default ManipulationBubbleChart;
