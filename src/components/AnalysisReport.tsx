// src/components/AnalysisReport.tsx

import React from 'react';
import { GeminiAnalysisResponse, GeminiFinding } from '../types';
import { InfoIcon } from '../constants';
import { useTranslation } from '../i18n';

// A color palette to visually link highlighted text to its finding.
const findingColors = [
  { bg: 'bg-yellow-200', border: 'border-yellow-400', text: 'text-yellow-800' },
  { bg: 'bg-blue-200', border: 'border-blue-400', text: 'text-blue-800' },
  { bg: 'bg-green-200', border: 'border-green-400', text: 'text-green-800' },
  { bg: 'bg-red-200', border: 'border-red-400', text: 'text-red-800' },
  { bg: 'bg-purple-200', border: 'border-purple-400', text: 'text-purple-800' },
  { bg: 'bg-pink-200', border: 'border-pink-400', text: 'text-pink-800' },
  { bg: 'bg-indigo-200', border: 'border-indigo-400', text: 'text-indigo-800' },
  { bg: 'bg-cyan-200', border: 'border-cyan-400', text: 'text-cyan-800' },
  { bg: 'bg-orange-200', border: 'border-orange-400', text: 'text-orange-800' },
];

/**
 * A utility function to escape special characters in a string so it can be
 * safely used inside a Regular Expression.
 */
function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface HighlightedTextProps {
  text: string;
  findingsMap: Map<string, { color: typeof findingColors[0] }>;
}

/**
 * This component correctly highlights all findings in the source text.
 */
const HighlightedText: React.FC<HighlightedTextProps> = ({ text, findingsMap }) => {
  if (findingsMap.size === 0) {
    return <p className="whitespace-pre-wrap">{text}</p>;
  }

  const uniqueQuotes = Array.from(findingsMap.keys());
  const regex = new RegExp(`(${uniqueQuotes.map(escapeRegex).join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <p className="whitespace-pre-wrap leading-relaxed">
      {parts.map((part, index) => {
        // Find a case-insensitive match in the map
        const originalQuote = uniqueQuotes.find(q => q.toLowerCase() === part.toLowerCase());
        const matchInfo = originalQuote ? findingsMap.get(originalQuote) : undefined;

        if (matchInfo) {
          return (
            <mark key={index} className={`${matchInfo.color.bg} p-0.5 rounded-sm`}>
              {part}
            </mark>
          );
        } else {
          return part;
        }
      })}
    </p>
  );
};


interface AnalysisReportProps {
  analysis: GeminiAnalysisResponse;
  sourceText: string | null;
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({ analysis, sourceText }) => {
  const { t } = useTranslation();
  const { findings } = analysis;
  const hasFindings = findings && findings.length > 0;

  // This map is the single source of truth for which color belongs to which quote.
  const findingsMap = new Map<string, { color: typeof findingColors[0] }>();
  if (hasFindings) {
    let colorIndex = 0;
    const assignedQuotes = new Set<string>();
    findings.forEach((finding) => {
      const lowerQuote = finding.specific_quote.toLowerCase();
      if (!assignedQuotes.has(lowerQuote)) {
        findingsMap.set(finding.specific_quote, {
          color: findingColors[colorIndex % findingColors.length],
        });
        assignedQuotes.add(lowerQuote);
        colorIndex++;
      }
    });
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">{t('report_title')}</h2>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md shadow-sm mb-8">
        <h3 className="text-lg font-semibold text-blue-800 mb-1">{t('report_summary_title')}</h3>
        <p className="text-blue-700">{analysis.analysis_summary}</p>
      </div>

      {sourceText && hasFindings && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('report_highlighted_text_title')}</h3>
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm max-h-96 overflow-y-auto">
            <HighlightedText text={sourceText} findingsMap={findingsMap} />
          </div>
        </div>
      )}

      {hasFindings ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">{t('report_detected_patterns_title')}</h3>
          <div className="space-y-4">
            {findings.map((finding, index) => {
              const matchInfo = findingsMap.get(finding.specific_quote);
              const color = matchInfo ? matchInfo.color : { bg: 'bg-gray-200', border: 'border-gray-300', text: 'text-gray-800' };

              return (
                <div key={index} className={`bg-gray-50 border ${color.border} rounded-lg shadow-md overflow-hidden`}>
                  <div className={`p-4 border-b ${color.border} ${color.bg}`}>
                    <h4 className={`text-l font-bold ${color.text} uppercase`}>
                      {finding.pattern_name}
                    </h4>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h5 className="font-semibold text-gray-600 mb-1">{t('report_quote_label')}</h5>
                      <blockquote className={`italic p-3 rounded-md ${color.bg} border-l-4 ${color.border} ${color.text}`}>
                        "{finding.specific_quote}"
                      </blockquote>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-600 mb-1">{t('report_explanation_label')}</h5>
                      <p className="text-gray-700">{finding.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 px-4 bg-green-50 border border-green-200 rounded-lg">
          <InfoIcon className="mx-auto h-12 w-12 text-green-600 mb-2"/>
          <p className="text-lg font-medium text-green-700">{t('report_no_patterns_detected')}</p>
        </div>
      )}
    </div>
  );
};

export default AnalysisReport;