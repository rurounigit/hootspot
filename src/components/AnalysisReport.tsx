// src/components/AnalysisReport.tsx

import React, { useState, useMemo } from 'react';
import { GeminiAnalysisResponse, GeminiFinding } from '../types';
import { InfoIcon } from '../constants';
import { useTranslation } from '../i18n';
import ShareMenu from './ShareMenu';
import ManipulationBubbleChart from './ManipulationBubbleChart';

const generateDistantColor = (index: number, saturation: number = 0.7, lightness: number = 0.6) => {
    const goldenAngle = 137.5;
    const hue = (index * goldenAngle) % 360;
    return `hsl(${hue}, ${saturation * 100}%, ${lightness * 100}%)`;
};

const UNIFORM_HIGHLIGHT_COLOR = 'bg-red-200';

function escapeRegex(string: string) { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

interface HighlightedTextProps {
  text: string;
  matches: { start: number; end: number; findings: (GeminiFinding & { displayIndex: number })[] }[];
  patternColorMap: Map<string, string>;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({ text, matches, patternColorMap }) => {
  const { t } = useTranslation();
  const [tooltip, setTooltip] = useState({ visible: false, title: '', description: '', x: 0, y: 0, color: '', textColor: '#fff' });

  if (!matches || matches.length === 0) return <p className="whitespace-pre-wrap">{text}</p>;

  const handlePillClick = (displayIndex: number) => {
    const element = document.getElementById(`finding-card-${displayIndex}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.transition = 'background-color 0.1s ease-in-out';
      element.style.backgroundColor = '#e0e7ff';
      setTimeout(() => { element.style.backgroundColor = ''; }, 800);
    }
  };

  const handlePillMouseOver = (event: React.MouseEvent, finding: GeminiFinding) => {
    const color = patternColorMap.get(finding.pattern_name) || '#ccc';
    setTooltip({
      visible: true,
      title: finding.display_name,
      description: t(finding.category),
      x: event.clientX,
      y: event.clientY,
      color: color,
      textColor: '#fff'
    });
  };

  const handlePillMouseLeave = () => { setTooltip({ ...tooltip, visible: false }); };

  const segments: React.ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, matchIndex) => {
    if (match.start > lastIndex) { segments.push(text.substring(lastIndex, match.start)); }
    const pills = match.findings.map(finding => {
      const color = patternColorMap.get(finding.pattern_name);
      if (!color) return null;
      return (<span key={`${finding.pattern_name}-${match.start}`} className="inline-block w-2.5 h-2.5 rounded-full mr-1 -mb-0.5 border border-gray-500 cursor-pointer" style={{ backgroundColor: color }} onClick={() => handlePillClick(finding.displayIndex)} onMouseOver={(e) => handlePillMouseOver(e, finding)} onMouseLeave={handlePillMouseLeave} />);
    });
    segments.push(<span key={`match-${matchIndex}`} className="inline-block">{pills}<mark className={`${UNIFORM_HIGHLIGHT_COLOR} p-0.5 rounded-sm`}>{text.substring(match.start, match.end)}</mark></span>);
    lastIndex = match.end;
  });

  if (lastIndex < text.length) { segments.push(text.substring(lastIndex)); }

  return (
    <>
      {tooltip.visible && (
        <div
          className="fixed max-w-xs px-3 py-2 rounded-lg shadow-xl text-sm pointer-events-none z-50"
          style={{ top: tooltip.y + 15, left: tooltip.x + 15, backgroundColor: tooltip.color, color: tooltip.textColor, border: `1px solid rgba(0,0,0,0.2)` }}
        >
          <strong className="font-bold block">{tooltip.title}</strong>
          {tooltip.description && <p className="mt-1">{tooltip.description}</p>}
        </div>
      )}
      <p className="whitespace-pre-wrap leading-relaxed">{segments.map((segment, index) => <React.Fragment key={index}>{segment}</React.Fragment>)}</p>
    </>
  );
};

const AnalysisReport: React.FC<{ analysis: GeminiAnalysisResponse; sourceText: string | null }> = ({ analysis, sourceText }) => {
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
  const { t } = useTranslation();
  const { findings } = analysis;
  const hasFindings = findings && findings.length > 0;

  const patternColorMap = useMemo(() => {
    const map = new Map<string, string>();
    if (hasFindings) {
      const uniquePatternNames = [...new Set(findings.map(f => f.pattern_name))];
      uniquePatternNames.forEach((name, index) => {
        map.set(name, generateDistantColor(index));
      });
    }
    return map;
  }, [findings, hasFindings]);

  const bubbleChartData = useMemo(() => {
    const baseWidth = 500; // The width at which bubbles are full size
    const scaleFactor = chartDimensions.width > 0
      ? Math.min(1, chartDimensions.width / baseWidth)
      : 1;

    if (!hasFindings) return [];

    return findings.map((finding, index) => {
        const strength = finding.strength;
        const radius = 2 + (strength * 6 * scaleFactor);

        return {
            id: `${finding.pattern_name}-${index}`,
            name: finding.display_name,
            strength: strength,
            category: finding.category,
            color: patternColorMap.get(finding.pattern_name) || '#cccccc',
            radius: radius,
        };
    });
  }, [findings, hasFindings, patternColorMap, chartDimensions]);

  const finalHighlights = useMemo(() => {
    const matchesByPosition = new Map<string, { start: number; end: number; findings: GeminiFinding[] }>();
    if (hasFindings && sourceText) {
      findings.forEach(finding => {
        const quote = finding.specific_quote;
        if (!quote || typeof quote !== 'string' || quote.trim() === '') return;
        const escapedQuote = escapeRegex(quote);
        const regex = new RegExp(escapedQuote, 'g');
        let match;
        while ((match = regex.exec(sourceText))) {
          const key = `${match.index}-${match.index + quote.length}`;
          const existing = matchesByPosition.get(key);
          if (existing) {
            if (!existing.findings.some(f => f.pattern_name === finding.pattern_name)) {
              existing.findings.push(finding);
            }
          } else {
            matchesByPosition.set(key, { start: match.index, end: match.index + quote.length, findings: [finding] });
          }
        }
      });
    }
    const sortedMatches = Array.from(matchesByPosition.values()).sort((a, b) => a.start - b.start);
    const uniqueFindingsWithIndices = new Map<string, number>();
    let findingCounter = 0;
    findings.forEach(finding => {
        const uniqueId = `${finding.pattern_name}::${finding.specific_quote}`;
        if (!uniqueFindingsWithIndices.has(uniqueId)) {
            uniqueFindingsWithIndices.set(uniqueId, findingCounter++);
        }
    });
    const matchesWithCorrectIndex = sortedMatches.map(match => ({
        ...match,
        findings: match.findings.map(f => {
            const uniqueId = `${f.pattern_name}::${f.specific_quote}`;
            return {
                ...f,
                displayIndex: uniqueFindingsWithIndices.get(uniqueId) as number
            };
        })
    }));
    const highlights: typeof matchesWithCorrectIndex = [];
    if (matchesWithCorrectIndex.length > 0) {
        let currentHighlight = { ...matchesWithCorrectIndex[0] };
        for (let i = 1; i < matchesWithCorrectIndex.length; i++) {
            const nextMatch = matchesWithCorrectIndex[i];
            if (nextMatch.start < currentHighlight.end) {
                nextMatch.findings.forEach(findingToAdd => {
                    if (!currentHighlight.findings.some(existing => existing.pattern_name === findingToAdd.pattern_name)) {
                        currentHighlight.findings.push(findingToAdd);
                    }
                });
                currentHighlight.end = Math.max(currentHighlight.end, nextMatch.end);
            } else {
                highlights.push(currentHighlight);
                currentHighlight = { ...nextMatch };
            }
        }
        highlights.push(currentHighlight);
    }
    return highlights;
  }, [findings, sourceText, hasFindings]);

  const indexedFindings = useMemo(() => {
    const uniqueFindingsWithIndices = new Map<string, number>();
    let findingCounter = 0;
    return findings.map(finding => {
        const uniqueId = `${finding.pattern_name}::${finding.specific_quote}`;
        if (!uniqueFindingsWithIndices.has(uniqueId)) {
            uniqueFindingsWithIndices.set(uniqueId, findingCounter++);
        }
        return {
            ...finding,
            displayIndex: uniqueFindingsWithIndices.get(uniqueId) as number
        };
    });
  }, [findings]);

  return (
    <div className="mt-4">
      <div className="flex items-center mb-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800 pb-0">{t('report_title')}</h2>
        {hasFindings && (
           <ShareMenu
              analysis={analysis}
              sourceText={sourceText}
              highlightData={finalHighlights}
              patternColorMap={patternColorMap}
           />
        )}
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-1">{t('report_summary_title')}</h3>
        <p className="text-blue-700">{analysis.analysis_summary}</p>
      </div>

      {hasFindings && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">{t('report_profile_title')}</h3>
          <ManipulationBubbleChart data={bubbleChartData} onDimensionsChange={setChartDimensions} // Add this prop
/>
        </div>
      )}

      {sourceText && hasFindings && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">{t('report_highlighted_text_title')}</h3>
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm max-h-96 overflow-y-auto">
            <HighlightedText text={sourceText} matches={finalHighlights} patternColorMap={patternColorMap} />
          </div>
        </div>
      )}

      {hasFindings ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">{t('report_detected_patterns_title')}</h3>
          <div className="space-y-4">
            {indexedFindings.map((finding, index) => {
              const color = patternColorMap.get(finding.pattern_name) || '#e5e7eb';

              return (
                <div key={index} id={`finding-card-${finding.displayIndex}`} className={`bg-gray-50 border rounded-lg shadow-md overflow-hidden`} style={{borderColor: color}}>
                  <div className={`p-4 border-b`} style={{ backgroundColor: color, borderColor: color }}>
                    <h4 className={`text-l font-bold text-white uppercase`}>{finding.display_name}</h4>
                  </div>
                  <div className="p-4 space-y-3">
                    <div><h5 className="font-semibold text-gray-600 mb-1">{t('report_quote_label')}</h5><blockquote className={`italic p-3 rounded-md border-l-4`} style={{ backgroundColor: `${color}40`, borderColor: color }}><p className="text-gray-800">"{finding.specific_quote}"</p></blockquote></div>
                    <div><h5 className="font-semibold text-gray-600 mb-1">{t('report_explanation_label')}</h5><p className="text-gray-700">{finding.explanation}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (<div className="text-center py-8 px-4 bg-green-50 border border-green-200 rounded-lg"><InfoIcon className="mx-auto h-12 w-12 text-green-600 mb-2"/><p className="text-lg font-medium text-green-700">{t('report_no_patterns_detected')}</p></div>)}
    </div>
  );
};

export default AnalysisReport;