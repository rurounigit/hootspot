
import React from 'react';
import { GeminiAnalysisResponse, GeminiFinding } from '../types';
import HighlightedSourceText from './HighlightedSourceText';

interface AnalysisReportProps {
  analysis: GeminiAnalysisResponse | null;
  sourceText: string | null; // Keep original source text for highlighting
}

const FindingCard: React.FC<{ finding: GeminiFinding }> = ({ finding }) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 overflow-hidden">
    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <h4 className="text-md font-semibold text-gray-800">{finding.pattern_name}</h4>
    </div>
    <div className="p-4">
      <div className="mb-3">
        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Identified Quote:</p>
        <blockquote className="border-l-4 border-blue-500 pl-3 py-1 bg-blue-50 text-blue-800 italic">
          "{finding.specific_quote}"
        </blockquote>
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Explanation:</p>
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{finding.explanation}</p>
      </div>
    </div>
  </div>
);

const AnalysisReport: React.FC<AnalysisReportProps> = ({ analysis, sourceText }) => {
  if (!analysis) {
    return null;
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-4">
      <h2 className="text-xl font-semibold text-gray-700 mb-3">Analysis Report</h2>

      <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-md">
        <h3 className="text-md font-semibold text-indigo-800 mb-1">AI Summary:</h3>
        <p className="text-sm text-indigo-700">{analysis.analysis_summary}</p>
      </div>

      {sourceText && analysis.findings && analysis.findings.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-700 mb-2">Highlighted Source Text:</h3>
          <div className="p-4 border border-gray-200 rounded-md bg-gray-50 max-h-96 overflow-y-auto">
            <HighlightedSourceText sourceText={sourceText} findings={analysis.findings} />
          </div>
        </div>
      )}

      {analysis.findings && analysis.findings.length > 0 ? (
        <div>
          <h3 className="text-md font-semibold text-gray-700 mb-3">Detected Patterns:</h3>
          {analysis.findings.map((finding, index) => (
            <FindingCard key={`${finding.pattern_name}-${index}`} finding={finding} />
          ))}
        </div>
      ) : (
        sourceText && <p className="text-gray-600">No specific manipulative patterns were identified in the provided text according to the current analysis criteria.</p>
      )}
    </div>
  );
};

export default AnalysisReport;
