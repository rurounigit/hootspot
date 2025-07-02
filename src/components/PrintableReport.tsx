// src/components/PrintableReport.tsx

import React, { useMemo } from 'react';
import { GeminiAnalysisResponse, GeminiFinding } from '../types';
import ManipulationProfileChart from './ManipulationProfileChart';
import { LEXICON_SECTIONS_BY_KEY, fullNameToKeyMap } from '../lexicon-structure';

// --- FIX: A more robust HighlightedText component for the PDF ---
// This version wraps each word individually to prevent alignment bugs in html2canvas.
const PrintableHighlightedText: React.FC<{ text: string, matches: any[] }> = ({ text, matches }) => {
  if (!matches || matches.length === 0) {
    return <p className="whitespace-pre-wrap leading-relaxed">{text}</p>;
  }

  const segments: React.ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, matchIndex) => {
    // Add the un-highlighted text before the current match
    if (match.start > lastIndex) {
      segments.push(text.substring(lastIndex, match.start));
    }

    // Get the text for the current highlight
    const highlightedPhrase = text.substring(match.start, match.end);

    // Split the phrase into words and wrap each one
    const words = highlightedPhrase.split(' ');
    words.forEach((word, wordIndex) => {
      segments.push(
        <span key={`${matchIndex}-${wordIndex}`} className="bg-red-200">
          {word}
        </span>
      );
      // Add a space back between words
      if (wordIndex < words.length - 1) {
        segments.push(' ');
      }
    });

    lastIndex = match.end;
  });

  // Add any remaining un-highlighted text after the last match
  if (lastIndex < text.length) {
    segments.push(text.substring(lastIndex));
  }

  return (
    <p className="whitespace-pre-wrap leading-relaxed">
      {segments.map((segment, index) => <React.Fragment key={index}>{segment}</React.Fragment>)}
    </p>
  );
};


interface PrintableReportProps {
  analysis: GeminiAnalysisResponse;
  sourceText: string | null;
  profileData: any[];
  highlightData: any[];
  patternColorMap: Map<string, any>;
}

const PrintableReport: React.FC<PrintableReportProps> = React.forwardRef<HTMLDivElement, PrintableReportProps>(
  ({ analysis, sourceText, profileData, highlightData, patternColorMap }, ref) => {

    const findingsByCategory = useMemo(() => {
      const keyToCategoryMap = new Map<string, string>();
      Object.entries(LEXICON_SECTIONS_BY_KEY).forEach(([category, patterns]) => {
        Object.keys(patterns).forEach(key => {
          keyToCategoryMap.set(key, category);
        });
      });

      return analysis.findings.reduce((acc, finding) => {
        const simpleKey = fullNameToKeyMap.get(finding.pattern_name);
        const category = simpleKey ? keyToCategoryMap.get(simpleKey) || 'Uncategorized' : 'Uncategorized';

        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(finding);
        return acc;
      }, {} as Record<string, GeminiFinding[]>);
    }, [analysis.findings]);

    return (
      // --- FIX: Added font-kerning to fix the letter spacing issue ---
      <div ref={ref} className="p-10 bg-white" style={{ width: '1200px', fontKerning: 'normal' }}>

        <div className="text-center mb-8 border-b pb-4">
          <h1 className="text-4xl font-bold text-gray-800">HootSpot AI Analysis Report</h1>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-1">Analysis Summary</h2>
          <p className="text-blue-700 text-lg">{analysis.analysis_summary}</p>
        </div>

        <div className="flex flex-row space-x-8 mb-8">
          <div className="flex-1 w-1/2 flex flex-col space-y-4">
            <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">Manipulation Profile</h2>
            {profileData.map(section => (
              section.hasFindings && (
                <ManipulationProfileChart
                  key={section.title}
                  data={section.data}
                  color={section.color}
                  hasFindings={section.hasFindings}
                />
              )
            ))}
          </div>

          <div className="flex-1 w-1/2">
             <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2 mb-4">Highlighted Source Text</h2>
             {sourceText && (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm text-base">
                    <PrintableHighlightedText text={sourceText} matches={highlightData} />
                </div>
             )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2 mb-6">Detected Patterns</h2>
          {Object.entries(findingsByCategory).map(([category, findings]) => (
            <div key={category} className="mb-6">
              <h3 className="text-xl font-bold text-gray-600 mb-4">{category}</h3>
              <div className="space-y-4">
                {findings.map((finding, index) => {
                  const color = patternColorMap.get(finding.pattern_name) || { hex: '#e5e7eb', border: 'border-gray-300', text: 'text-gray-800' };
                  return (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg shadow-md overflow-hidden break-inside-avoid">
                      <div className="p-4 border-b" style={{ backgroundColor: color.hex, borderColor: color.border }}>
                        <h4 className="text-lg font-bold uppercase" style={{ color: color.text }}>{finding.pattern_name}</h4>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                            <h5 className="font-semibold text-gray-600 mb-1">Specific Quote:</h5>
                            <blockquote className="italic p-3 rounded-md border-l-4" style={{ backgroundColor: color.hex, borderColor: color.border }}>
                                <p style={{ color: color.text }}>"{finding.specific_quote}"</p>
                            </blockquote>
                        </div>
                        <div>
                            <h5 className="font-semibold text-gray-600 mb-1">Explanation:</h5>
                            <p className="text-gray-700">{finding.explanation}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

export default PrintableReport;