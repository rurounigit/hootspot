// src/components/analysis/AnalysisReport.tsx

import React, { useState } from 'react';
import { GeminiAnalysisResponse } from '../../types/api';
import { InfoIcon } from '../../assets/icons';
import { useTranslation } from '../../i18n';
import ShareMenu from './ShareMenu';
import ManipulationBubbleChart from './ManipulationBubbleChart';
import RebuttalGenerator from './RebuttalGenerator';
import HighlightedText from './HighlightedText';
import { useAnalysisReportData } from '../../hooks/useAnalysisReportData';

// Updated props for clarity and consistency
interface AnalysisReportProps {
  analysis: GeminiAnalysisResponse;
  sourceText: string | null;
  rebuttal: string | null;
  isTranslatingRebuttal: boolean;
  onRebuttalUpdate: (newRebuttal: string) => void;
  includeRebuttalInJson: boolean;
  includeRebuttalInPdf: boolean;
  serviceProvider: 'google' | 'local';
  localProviderType: 'lm-studio' | 'ollama';
  apiKey: string | null;
  googleModel: string;
  lmStudioConfig: { url: string; model: string; };
  ollamaConfig: { url: string; model: string; };
  isCurrentProviderConfigured: boolean;
}

const AnalysisReport: React.FC<AnalysisReportProps> = (props) => {
  const {
    analysis, sourceText, rebuttal, isTranslatingRebuttal, onRebuttalUpdate,
    includeRebuttalInJson, includeRebuttalInPdf, serviceProvider, localProviderType,
    apiKey, googleModel, lmStudioConfig, ollamaConfig, isCurrentProviderConfigured
  } = props;

  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null);
  const { t } = useTranslation();

  const {
    hasFindings, patternColorMap, indexedFindings, bubbleChartData, finalHighlights,
  } = useAnalysisReportData(analysis, sourceText, chartDimensions.width);

  const handleBubbleClick = (findingId: string) => {
    setActiveFindingId(findingId);
    const element = document.getElementById(`finding-card-${findingId.split('-').pop()}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-indigo-100', 'dark:bg-indigo-800/50', 'transition-colors', 'duration-200');
      setTimeout(() => {
        element.classList.remove('bg-indigo-100', 'dark:bg-indigo-800/50');
        setActiveFindingId(null);
      }, 800);
    } else {
      setActiveFindingId(null);
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-50 pb-0">{t('report_title')}</h2>
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

      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 p-4 rounded-md shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-1">{t('report_summary_title')}</h3>
        <p className="text-blue-800 dark:text-blue-300">{analysis.analysis_summary}</p>
      </div>

      {hasFindings && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('report_profile_title')}</h3>
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
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('report_highlighted_text_title')}</h3>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm max-h-96 overflow-y-auto">
            <HighlightedText text={sourceText} matches={finalHighlights} patternColorMap={patternColorMap} />
          </div>
        </div>
      )}

      {hasFindings ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('report_detected_patterns_title')}</h3>
          <div className="space-y-4">
            {indexedFindings.map((finding) => {
              const color = patternColorMap.get(finding.pattern_name) || '#e5e7eb';
              return (
                <div key={finding.displayIndex} id={`finding-card-${finding.displayIndex}`} className={`bg-white dark:bg-gray-800 border-l-4 rounded-lg shadow-md overflow-hidden`} style={{borderColor: color}}>
                  <div className={`p-4 border-b`} style={{ backgroundColor: color, borderColor: color }}>
                    <h4 className={`text-l font-bold text-white uppercase`}>{finding.display_name}</h4>
                  </div>
                  <div className="p-4 space-y-3">
                    <div><h5 className="font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('report_quote_label')}</h5><blockquote className={`italic p-3 rounded-md border-l-4`} style={{ backgroundColor: `${color}40`, borderColor: color }}><p className="text-gray-800 dark:text-gray-50">"{finding.specific_quote}"</p></blockquote></div>
                    <div><h5 className="font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('report_explanation_label')}</h5><p className="text-gray-700 dark:text-gray-50">{finding.explanation}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (<div className="text-center py-8 px-4 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-500 rounded-lg"><InfoIcon className="mx-auto h-12 w-12 text-green-600 dark:text-green-400 mb-2"/><p className="text-lg font-medium text-green-600 dark:text-green-400">{t('report_no_patterns_detected')}</p></div>)}

      {hasFindings && sourceText && (
        <RebuttalGenerator
          analysis={analysis}
          sourceText={sourceText}
          rebuttalForDisplay={rebuttal}
          isTranslating={isTranslatingRebuttal}
          onUpdate={onRebuttalUpdate}
          serviceProvider={serviceProvider}
          localProviderType={localProviderType}
          apiKey={apiKey}
          googleModel={googleModel}
          lmStudioConfig={lmStudioConfig}
          ollamaConfig={ollamaConfig}
          isCurrentProviderConfigured={isCurrentProviderConfigured}
        />
      )}
    </div>
  );
};

export default AnalysisReport;