// src/components/PrintableReport.tsx

import React, { useMemo } from 'react';
import { GeminiAnalysisResponse, GeminiFinding } from '../types';
import ManipulationProfileChart from './ManipulationProfileChart';
import { LEXICON_SECTIONS_BY_KEY, fullNameToKeyMap } from '../lexicon-structure';

// --- REVISED & FINAL: Highlighting component with box-decoration-break to fix gaps ---
const PrintableHighlightedText: React.FC<{ text: string; matches: any[] }> = ({ text, matches }) => {
  if (!text || !matches || matches.length === 0) {
    return <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{text}</p>;
  }

  const segments: { content: string; highlighted: boolean }[] = [];
  let lastIndex = 0;

  const sortedMatches = [...matches].sort((a, b) => a.start - b.start);

  sortedMatches.forEach(match => {
    if (match.start > lastIndex) {
      segments.push({ content: text.substring(lastIndex, match.start), highlighted: false });
    }
    // The style for highlighting is now more robust for PDF rendering
    segments.push({ content: text.substring(match.start, match.end), highlighted: true });
    lastIndex = match.end;
  });

  if (lastIndex < text.length) {
    segments.push({ content: text.substring(lastIndex), highlighted: false });
  }

  return (
    <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '16px' }}>
      {segments.map((segment, index) =>
        segment.highlighted ? (
          <span key={index} style={{
            backgroundColor: '#fecaca', // A light red color
            // @ts-ignore
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone',
             padding: '0.1em 0', // Adds a tiny bit of vertical padding
          }}>
            {segment.content}
          </span>
        ) : (
          <React.Fragment key={index}>{segment.content}</React.Fragment>
        )
      )}
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
      <div ref={ref} style={{ width: '1200px', backgroundColor: 'white', padding: '40px', fontFamily: 'sans-serif' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                HootSpot AI Analysis Report
            </h1>
        </div>

        <div style={{ borderLeft: '4px solid #60a5fa', backgroundColor: '#eff6ff', padding: '1rem', marginBottom: '2rem', borderRadius: '4px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1d4ed8', marginBottom: '0.25rem' }}>Analysis Summary</h2>
          <p style={{ color: '#1e40af', fontSize: '1.125rem' }}>{analysis.analysis_summary}</p>
        </div>

        {/* --- Using a single-column layout for rendering stability --- */}

        <div style={{ marginBottom: '2rem' }}>
             <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Highlighted Source Text</h2>
             {sourceText && (
                <div style={{ backgroundColor: 'white', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                    <PrintableHighlightedText text={sourceText} matches={highlightData} />
                </div>
             )}
        </div>

        {profileData.some(s => s.hasFindings) && (
            <div style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Manipulation Profile</h2>
                {profileData.map(section => (
                  section.hasFindings && (
                    <div key={section.title} style={{ marginBottom: '1rem' }}>
                        <ManipulationProfileChart
                          data={section.data}
                          color={section.color}
                          hasFindings={section.hasFindings}
                        />
                    </div>
                  )
                ))}
            </div>
        )}

        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Detected Patterns</h2>
          {Object.entries(findingsByCategory).map(([category, findings]) => (
            <div key={category} style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4b5563', marginBottom: '1rem' }}>{category}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {findings.map((finding, index) => {
                  const color = patternColorMap.get(finding.pattern_name) || { hex: '#f3f4f6', border: '#e5e7eb', text: '#1f2937' };
                  return (
                    <div key={index} style={{ backgroundColor: '#f9fafb', border: `1px solid ${color.border}`, borderRadius: '0.5rem', overflow: 'hidden', pageBreakInside: 'avoid' }}>
                      <div style={{ padding: '1rem', borderBottom: `1px solid ${color.border}`, backgroundColor: color.hex }}>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', textTransform: 'uppercase', color: color.text }}>{finding.pattern_name}</h4>
                      </div>
                      <div style={{ padding: '1rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <h5 style={{ fontWeight: '600', color: '#4b5563', marginBottom: '0.5rem' }}>Specific Quote:</h5>
                            <blockquote style={{ fontStyle: 'italic', padding: '0.75rem', borderRadius: '0.375rem', borderLeft: `4px solid ${color.border}`, backgroundColor: color.hex }}>
                                <p style={{ color: color.text }}>"{finding.specific_quote}"</p>
                            </blockquote>
                        </div>
                        <div>
                            <h5 style={{ fontWeight: '600', color: '#4b5563', marginBottom: '0.25rem' }}>Explanation:</h5>
                            <p style={{ color: '#374151' }}>{finding.explanation}</p>
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