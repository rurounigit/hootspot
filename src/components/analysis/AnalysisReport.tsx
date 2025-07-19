// src/components/analysis/AnalysisReport.tsx

import React, { useState, useMemo } from 'react';
import { GeminiAnalysisResponse, GeminiFinding } from '../../types/api';
import { InfoIcon } from '../../assets/icons';
import { useTranslation } from '../../i18n';
import ShareMenu from './ShareMenu';
import ManipulationBubbleChart from './ManipulationBubbleChart';
import RebuttalGenerator from './RebuttalGenerator';
import HighlightedText from './HighlightedText';

const generateDistantColor = (index: number, saturation: number = 0.7, lightness: number = 0.6) => {
    const goldenAngle = 137.5;
    const hue = (index * goldenAngle) % 360;
    return `hsl(${hue}, ${saturation * 100}%, ${lightness * 100}%)`;
};

function escapeRegex(string: string) { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

interface AnalysisReportProps {
  analysis: GeminiAnalysisResponse;
  sourceText: string | null;
  apiKey: string | null;
  selectedModel: string;
  rebuttal: string | null;
  isTranslatingRebuttal: boolean;
  onRebuttalUpdate: (newRebuttal: string) => void;
  includeRebuttalInJson: boolean;
  includeRebuttalInPdf: boolean;
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({
    analysis,
    sourceText,
    apiKey,
    selectedModel,
    rebuttal,
    isTranslatingRebuttal,
    onRebuttalUpdate,
    includeRebuttalInJson,
    includeRebuttalInPdf,
}) => {
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null);
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

  const bubbleChartData = useMemo(() => {
    const baseWidth = 500;
    const scaleFactor = chartDimensions.width > 0
      ? Math.min(1, chartDimensions.width / baseWidth)
      : 1;

    if (!hasFindings) return [];

    return indexedFindings.map((finding) => {
        const strength = finding.strength;
        const radius = 2 + (strength * 6 * scaleFactor);

        return {
            id: `${finding.pattern_name}-${finding.displayIndex}`,
            name: finding.display_name,
            strength: strength,
            category: finding.category,
            color: patternColorMap.get(finding.pattern_name) || '#cccccc',
            radius: radius,
        };
    });
  }, [indexedFindings, hasFindings, patternColorMap, chartDimensions]);

  const finalHighlights = useMemo(() => {
    const matchesByPosition = new Map<string, { start: number; end: number; findings: (GeminiFinding & { displayIndex: number })[] }>();

    if (hasFindings && sourceText) {
      indexedFindings.forEach(finding => {
        const quote = finding.specific_quote;
        if (!quote || typeof quote !== 'string' || quote.trim() === '') return;

        const escapedQuote = escapeRegex(quote);
        const regex = new RegExp(escapedQuote, 'g');
        let match;

        while ((match = regex.exec(sourceText))) {
          const key = `${match.index}-${match.index + quote.length}`;
          const existing = matchesByPosition.get(key);

          if (existing) {
            if (!existing.findings.some(f => f.pattern_name === finding.pattern_name && f.specific_quote === finding.specific_quote)) {
              existing.findings.push(finding);
            }
          } else {
            matchesByPosition.set(key, {
              start: match.index,
              end: match.index + quote.length,
              findings: [finding]
            });
          }
        }
      });
    }

    const sortedMatches = Array.from(matchesByPosition.values()).sort((a, b) => a.start - b.start);

    const mergedHighlights: typeof sortedMatches = [];
    if (sortedMatches.length > 0) {
      let currentHighlight = { ...sortedMatches[0] };

      for (let i = 1; i < sortedMatches.length; i++) {
        const nextMatch = sortedMatches[i];

        if (nextMatch.start < currentHighlight.end) {
          nextMatch.findings.forEach(findingToAdd => {
            if (!currentHighlight.findings.some(existing => existing.pattern_name === findingToAdd.pattern_name && existing.specific_quote === findingToAdd.specific_quote)) {
              currentHighlight.findings.push(findingToAdd);
            }
          });
          currentHighlight.end = Math.max(currentHighlight.end, nextMatch.end);
        } else {
          mergedHighlights.push(currentHighlight);
          currentHighlight = { ...nextMatch };
        }
      }
      mergedHighlights.push(currentHighlight);
    }

    return mergedHighlights;
  }, [indexedFindings, sourceText, hasFindings]);

  const handleBubbleClick = (findingId: string) => {
    setActiveFindingId(findingId);
    const finding = indexedFindings.find(f => `${f.pattern_name}-${f.displayIndex}` === findingId);
    if (finding) {
      const element = document.getElementById(`finding-card-${finding.displayIndex}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('bg-card-highlight-light', 'dark:bg-card-highlight-dark', 'transition-colors', 'duration-200');
        setTimeout(() => {
          element.classList.remove('bg-card-highlight-light', 'dark:bg-card-highlight-dark');
          setActiveFindingId(null);
        }, 800);
      } else {
        setActiveFindingId(null);
      }
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center mb-4">
        <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark pb-0">{t('report_title')}</h2>
        {hasFindings && (
           <ShareMenu
              analysis={analysis}
              sourceText={sourceText}
              highlightData={finalHighlights}
              patternColorMap={patternColorMap}
              bubbleChartData={bubbleChartData}
              rebuttal={rebuttal}
              includeRebuttalInJson={includeRebuttalInJson}
              includeRebuttalInPdf={includeRebuttalInPdf}
           />
        )}
      </div>

      <div className="bg-info-bg-light dark:bg-info-bg-dark border border-info-border-light dark:border-info-border-dark p-4 rounded-md shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-info-text-light dark:text-info-text-dark mb-1">{t('report_summary_title')}</h3>
        <p className="text-info-text-light dark:text-info-text-dark">{analysis.analysis_summary}</p>
      </div>

      {hasFindings && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text-label-light dark:text-text-label-dark mb-4">{t('report_profile_title')}</h3>
          <ManipulationBubbleChart
            data={bubbleChartData}
            onDimensionsChange={setChartDimensions}
            onBubbleClick={handleBubbleClick}
            activeFindingId={activeFindingId}
          />
        </div>
      )}

      {sourceText && hasFindings && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text-label-light dark:text-text-label-dark mb-4">{t('report_highlighted_text_title')}</h3>
          <div className="bg-container-bg-light dark:bg-container-bg-dark p-4 border border-container-border-light dark:border-container-border-dark rounded-lg shadow-sm max-h-96 overflow-y-auto">
            <HighlightedText text={sourceText} matches={finalHighlights} patternColorMap={patternColorMap} />
          </div>
        </div>
      )}

      {hasFindings ? (
        <div>
          <h3 className="text-lg font-semibold text-text-label-light dark:text-text-label-dark mb-3">{t('report_detected_patterns_title')}</h3>
          <div className="space-y-4">
            {indexedFindings.map((finding) => {
              const color = patternColorMap.get(finding.pattern_name) || '#e5e7eb';
              return (
                <div key={finding.displayIndex} id={`finding-card-${finding.displayIndex}`} className={`bg-panel-bg-light dark:bg-panel-bg-dark border rounded-lg shadow-md overflow-hidden`} style={{borderColor: color}}>
                  <div className={`p-4 border-b`} style={{ backgroundColor: color, borderColor: color }}>
                    <h4 className={`text-l font-bold text-button-text-light uppercase`}>{finding.display_name}</h4>
                  </div>
                  <div className="p-4 space-y-3">
                    <div><h5 className="font-semibold text-text-subtle-light dark:text-text-subtle-dark mb-1">{t('report_quote_label')}</h5><blockquote className={`italic p-3 rounded-md border-l-4`} style={{ backgroundColor: `${color}40`, borderColor: color }}><p className="text-text-main-light dark:text-text-main-dark">"{finding.specific_quote}"</p></blockquote></div>
                    <div><h5 className="font-semibold text-text-subtle-light dark:text-text-subtle-dark mb-1">{t('report_explanation_label')}</h5><p className="text-text-label-light dark:text-text-main-dark">{finding.explanation}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (<div className="text-center py-8 px-4 bg-success-bg-light dark:bg-success-bg-dark border border-success-border-light dark:border-success-border-dark rounded-lg"><InfoIcon className="mx-auto h-12 w-12 text-success-text-light dark:text-success-text-dark mb-2"/><p className="text-lg font-medium text-success-text-light dark:text-success-text-dark">{t('report_no_patterns_detected')}</p></div>)}

      {hasFindings && sourceText && (
        <RebuttalGenerator
          analysis={analysis}
          sourceText={sourceText}
          apiKey={apiKey}
          selectedModel={selectedModel}
          rebuttalForDisplay={rebuttal}
          isTranslating={isTranslatingRebuttal}
          onUpdate={onRebuttalUpdate}
        />
      )}
    </div>
  );
};

export default AnalysisReport;
