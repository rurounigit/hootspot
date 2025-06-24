// src/components/AnalysisReport.tsx

import React from 'react';
import { GeminiAnalysisResponse, GeminiFinding } from '../types';
import { InfoIcon } from '../constants';
import { useTranslation } from '../i18n';

// A color palette for pattern identification
const findingColors = [
  { hex: '#fef08a', border: 'border-yellow-400', text: 'text-yellow-800' }, // yellow
  { hex: '#bfdbfe', border: 'border-blue-400', text: 'text-blue-800' },     // blue
  { hex: '#a7f3d0', border: 'border-green-400', text: 'text-green-800' },    // green
  { hex: '#e9d5ff', border: 'border-purple-400', text: 'text-purple-800' }, // purple
  { hex: '#fbcfe8', border: 'border-pink-400', text: 'text-pink-800' },     // pink
  { hex: '#c7d2fe', border: 'border-indigo-400', text: 'text-indigo-800' }, // indigo
  { hex: '#cffafe', border: 'border-cyan-400', text: 'text-cyan-800' },     // cyan
  { hex: '#fed7aa', border: 'border-orange-400', text: 'text-orange-800' }, // orange
];

const UNIFORM_HIGHLIGHT_COLOR = 'bg-red-200';

const patternNameToI18nKeyMap = new Map<string, string>([
    ["Guilt Tripping", "pattern_guilt_tripping"], ["Gaslighting", "pattern_gaslighting"],
    ["Threatening / Coercion", "pattern_threatening_coercion"], ["Invalidation / Minimizing", "pattern_invalidation_minimizing"],
    ["Deflection / Shifting Blame", "pattern_deflection_shifting_blame"], ["DARVO (Deny, Attack, and Reverse Victim and Offender)", "pattern_darvo"],
    ["Moving the Goalposts", "pattern_moving_the_goalposts"], ["Love Bombing", "pattern_love_bombing"],
    ["Projection", "pattern_projection"], ["Splitting (or Black-and-White Thinking)", "pattern_splitting"],
    ["The Backhanded Compliment", "pattern_the_backhanded_compliment"], ["Weaponized Incompetence", "pattern_weaponized_incompetence"],
    ["The Silent Treatment (Stonewalling)", "pattern_the_silent_treatment"], ["The Straw Man Fallacy", "pattern_the_straw_man_fallacy"],
    ["The Co-optation of Dissent: \"Radical\" Language for Status Quo Ends", "pattern_the_co_optation_of_dissent"],
    ["Redefining the Terrain: The \"Culture War\" as Economic Distraction", "pattern_redefining_the_terrain"],
    ["The Foreclosure of Alternatives: \"There Is No Alternative\" (TINA) 2.0", "pattern_the_foreclosure_of_alternatives"],
    ["Manufacturing Reflexive Impotence: \"Both Sides\" and Information Overload", "pattern_manufacturing_reflexive_impotence"],
    ["The Personalization of Systemic Problems", "pattern_the_personalization_of_systemic_problems"],
    ["Dog-Whistling", "pattern_dog-whistling"], ["Euphemism & Jargon", "pattern_euphemism_jargon"]
]);

function escapeRegex(string: string) { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

interface HighlightedTextProps {
  text: string;
  matches: { start: number; end: number; findings: GeminiFinding[] }[];
  patternColorMap: Map<string, { hex: string, border: string, text: string }>;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, matches, patternColorMap }) => {
  const { t } = useTranslation();
  if (!matches || matches.length === 0) return <p className="whitespace-pre-wrap">{text}</p>;

  const segments: React.ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, matchIndex) => {
    if (match.start > lastIndex) {
      segments.push(text.substring(lastIndex, match.start));
    }
    const pills = match.findings.map(finding => {
      const colorInfo = patternColorMap.get(finding.pattern_name);
      const i18nKey = patternNameToI18nKeyMap.get(finding.pattern_name) || finding.pattern_name;
      if (!colorInfo) return null;
      return (<span key={`${finding.pattern_name}-${match.start}`} title={t(i18nKey)} className="inline-block w-2.5 h-2.5 rounded-full mr-1 -mb-0.5 border border-gray-400" style={{ backgroundColor: colorInfo.hex }} />);
    });
    segments.push(<span key={`match-${matchIndex}`} className="inline-block">{pills}<mark className={`${UNIFORM_HIGHLIGHT_COLOR} p-0.5 rounded-sm`}>{text.substring(match.start, match.end)}</mark></span>);
    lastIndex = match.end;
  });

  if (lastIndex < text.length) {
    segments.push(text.substring(lastIndex));
  }

  return (<p className="whitespace-pre-wrap leading-relaxed">{segments.map((segment, index) => <React.Fragment key={index}>{segment}</React.Fragment>)}</p>);
};

const AnalysisReport: React.FC<{ analysis: GeminiAnalysisResponse; sourceText: string | null }> = ({ analysis, sourceText }) => {
  const { t } = useTranslation();
  const { findings } = analysis;
  const hasFindings = findings && findings.length > 0;

  // 1. Stable color mapping for patterns
  const patternColorMap = new Map<string, typeof findingColors[0]>();
  if (hasFindings) {
    const uniquePatternNames = [...new Set(findings.map(f => f.pattern_name))];
    uniquePatternNames.forEach((name, index) => {
      patternColorMap.set(name, findingColors[index % findingColors.length]);
    });
  }

  // 2. Find all occurrences of each quote and group by exact position
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

  // 3. *** THE DEFINITIVE FIX: MERGE OVERLAPPING/NESTED HIGHLIGHTS ***
  const finalHighlights: typeof sortedMatches = [];
  if (sortedMatches.length > 0) {
    let currentHighlight = { ...sortedMatches[0], findings: [...sortedMatches[0].findings] };

    for (let i = 1; i < sortedMatches.length; i++) {
        const nextMatch = sortedMatches[i];
        // Check for overlap: if next match starts before the current one ends.
        if (nextMatch.start < currentHighlight.end) {
            // Merge the findings, avoiding duplicates.
            nextMatch.findings.forEach(findingToAdd => {
                if (!currentHighlight.findings.some(existing => existing.pattern_name === findingToAdd.pattern_name)) {
                    currentHighlight.findings.push(findingToAdd);
                }
            });
            // Extend the highlight region to encompass both.
            currentHighlight.end = Math.max(currentHighlight.end, nextMatch.end);
        } else {
            // No overlap, so push the completed highlight and start a new one.
            finalHighlights.push(currentHighlight);
            currentHighlight = { ...nextMatch, findings: [...nextMatch.findings] };
        }
    }
    // Add the very last highlight group to the results.
    finalHighlights.push(currentHighlight);
  }

  // The list for the report cards should be based on the original API response, sorted by appearance.
  const allFindingsForDisplay = sortedMatches.flatMap(match => match.findings);

  return (
    <div className="mt-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-0">{t('report_title')}</h2>
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md shadow-sm mb-4"><h3 className="text-lg font-semibold text-blue-800 mb-1">{t('report_summary_title')}</h3><p className="text-blue-700">{analysis.analysis_summary}</p></div>
      {sourceText && hasFindings && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">{t('report_highlighted_text_title')}</h3>
          {/* Pass the merged and corrected highlight data to the component */}
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm max-h-96 overflow-y-auto"><HighlightedText text={sourceText} matches={finalHighlights} patternColorMap={patternColorMap} /></div>
        </div>
      )}
      {hasFindings ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">{t('report_detected_patterns_title')}</h3>
          <div className="space-y-4">
            {allFindingsForDisplay.map((finding, index) => {
              const color = patternColorMap.get(finding.pattern_name) || { hex: '#e5e7eb', border: 'border-gray-300', text: 'text-gray-800' };
              const i18nKey = patternNameToI18nKeyMap.get(finding.pattern_name) || finding.pattern_name;
              return (<div key={`${finding.pattern_name}-${index}`} className={`bg-gray-50 border ${color.border} rounded-lg shadow-md overflow-hidden`}><div className={`p-4 border-b ${color.border}`} style={{ backgroundColor: color.hex }}><h4 className={`text-l font-bold ${color.text} uppercase`}>{t(i18nKey)}</h4></div><div className="p-4 space-y-3"><div><h5 className="font-semibold text-gray-600 mb-1">{t('report_quote_label')}</h5><blockquote className={`italic p-3 rounded-md border-l-4 ${color.border}`} style={{ backgroundColor: color.hex }}><p className={color.text}>"{finding.specific_quote}"</p></blockquote></div><div><h5 className="font-semibold text-gray-600 mb-1">{t('report_explanation_label')}</h5><p className="text-gray-700">{finding.explanation}</p></div></div></div>);
            })}
          </div>
        </div>
      ) : (<div className="text-center py-8 px-4 bg-green-50 border border-green-200 rounded-lg"><InfoIcon className="mx-auto h-12 w-12 text-green-600 mb-2"/><p className="text-lg font-medium text-green-700">{t('report_no_patterns_detected')}</p></div>)}
    </div>
  );
};

export default AnalysisReport;