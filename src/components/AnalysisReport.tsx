// src/components/AnalysisReport.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { GeminiAnalysisResponse, GeminiFinding } from '../types';
import { InfoIcon } from '../constants';
import { useTranslation } from '../i18n';
import ManipulationProfileChart from './ManipulationProfileChart';
import ShareMenu from './ShareMenu';
import { LEXICON_SECTIONS_BY_KEY, fullNameToKeyMap, keyToDescKeyMap, patternNameToI18nKeyMap } from '../lexicon-structure';

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

const CATEGORY_COLORS: Record<string, string> = {
  'category_interpersonal_psychological': '#8884d8',
  'category_covert_indirect_control': '#82ca9d',
  'category_sociopolitical_rhetorical': '#ffc658',
};

const UNIFORM_HIGHLIGHT_COLOR = 'bg-red-200';

function escapeRegex(string: string) { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

interface HighlightedTextProps {
  text: string;
  matches: { start: number; end: number; findings: (GeminiFinding & { displayIndex: number })[] }[];
  patternColorMap: Map<string, { hex: string, border: string, text: string }>;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({ text, matches, patternColorMap }) => {
  const { t } = useTranslation();
  const [tooltip, setTooltip] = useState({ visible: false, title: '', description: '', x: 0, y: 0, color: '', textColor: '' });

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

  const handlePillMouseOver = (event: React.MouseEvent, finding: GeminiFinding, color: { hex: string, text: string }) => {
    const i18nKey = patternNameToI18nKeyMap.get(finding.pattern_name) || finding.pattern_name;
    const simpleKey = fullNameToKeyMap.get(finding.pattern_name);
    const descI18nKey = simpleKey ? keyToDescKeyMap.get(simpleKey) : '';

    setTooltip({
      visible: true,
      title: t(i18nKey),
      description: descI18nKey ? t(descI18nKey) : '',
      x: event.clientX,
      y: event.clientY,
      color: color.hex,
      textColor: color.text
    });
  };

  const handlePillMouseLeave = () => { setTooltip({ ...tooltip, visible: false }); };

  const segments: React.ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, matchIndex) => {
    if (match.start > lastIndex) { segments.push(text.substring(lastIndex, match.start)); }
    const pills = match.findings.map(finding => {
      const colorInfo = patternColorMap.get(finding.pattern_name);
      if (!colorInfo) return null;
      return (<span key={`${finding.pattern_name}-${match.start}`} className="inline-block w-2.5 h-2.5 rounded-full mr-1 -mb-0.5 border border-gray-500 cursor-pointer" style={{ backgroundColor: colorInfo.hex }} onClick={() => handlePillClick(finding.displayIndex)} onMouseOver={(e) => handlePillMouseOver(e, finding, colorInfo)} onMouseLeave={handlePillMouseLeave} />);
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
          style={{ top: tooltip.y + 15, left: tooltip.x + 15, backgroundColor: tooltip.color, color: tooltip.textColor, border: `1px solid ${tooltip.textColor}` }}
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
  const { t } = useTranslation();
  const { findings } = analysis;
  const hasFindings = findings && findings.length > 0;

  const [activeTab, setActiveTab] = useState<string | null>(null);

  const patternColorMap = useMemo(() => {
    const map = new Map<string, typeof findingColors[0]>();
    if (hasFindings) {
      const uniquePatternNames = [...new Set(findings.map(f => f.pattern_name))];
      uniquePatternNames.forEach((name, index) => {
        map.set(name, findingColors[index % findingColors.length]);
      });
    }
    return map;
  }, [findings, hasFindings]);

  const profileDataBySection = useMemo(() => {
    const CATEGORY_ICONS: Record<string, string> = {
      'category_interpersonal_psychological': 'images/category-icons/psychological.png',
      'category_covert_indirect_control': 'images/category-icons/control.png',
      'category_sociopolitical_rhetorical': 'images/category-icons/sociopolitical.png',
    };

    const counts = new Map<string, number>();
    if (hasFindings) {
      for (const finding of findings) {
        const simpleKey = fullNameToKeyMap.get(finding.pattern_name);
        if (simpleKey) {
          counts.set(simpleKey, (counts.get(simpleKey) || 0) + 1);
        }
      }
    }

    const sections = Object.entries(LEXICON_SECTIONS_BY_KEY).map(([sectionTitleKey, patterns]) => {
      let totalFindings = 0;
      const data = Object.entries(patterns).map(([simpleKey, shortNameKey]) => {
        const count = counts.get(simpleKey) || 0;
        totalFindings += count;
        return {
          tactic: t(shortNameKey), // Translate short name
          count: 1 + count,
          simpleKey: simpleKey, // Pass simpleKey for reliable tooltip lookup
        };
      });

      const translatedTitle = t(sectionTitleKey);
      return {
        titleKey: sectionTitleKey,
        translatedTitle: translatedTitle,
        icon: CATEGORY_ICONS[sectionTitleKey],
        data: data,
        hasFindings: totalFindings > 0,
        totalFindings: totalFindings,
        color: CATEGORY_COLORS[sectionTitleKey],
      };
    });

    sections.sort((a, b) => b.totalFindings - a.totalFindings);

    return sections;
  }, [findings, hasFindings, t]);

  useEffect(() => {
    if (profileDataBySection && profileDataBySection.length > 0) {
      const firstActiveSection = profileDataBySection.find(s => s.hasFindings) || profileDataBySection[0];
      setActiveTab(firstActiveSection.translatedTitle);
    }
  }, [profileDataBySection]);

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

    // Create a stable index for each unique finding instance for jump-to-card functionality
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
              profileData={profileDataBySection}
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

          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
              {profileDataBySection.map(section => (
                <button
                  key={section.titleKey}
                  onClick={() => section.hasFindings && setActiveTab(section.translatedTitle)}
                  disabled={!section.hasFindings}
                  title={section.hasFindings ? section.translatedTitle : t('report_profile_no_findings_in_category')}
                  className={`
                    whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm
                    ${activeTab === section.translatedTitle
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                    ${!section.hasFindings ? 'text-gray-400 cursor-not-allowed hover:border-transparent' : ''}
                  `}
                >
                  <img
                    src={chrome.runtime.getURL(section.icon)}
                    alt={section.translatedTitle}
                    className="w-12 h-12"
                  />
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-4">
            {profileDataBySection.map(section => (
              <div
                key={section.titleKey}
                id={`chart-container-${section.translatedTitle}`}
                className={activeTab === section.translatedTitle ? 'block' : 'hidden'}
              >
                <ManipulationProfileChart
                  data={section.data}
                  color={section.color}
                  hasFindings={section.hasFindings}
                />
              </div>
            ))}
          </div>
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
              const color = patternColorMap.get(finding.pattern_name) || { hex: '#e5e7eb', border: 'border-gray-300', text: 'text-gray-800' };
              const i18nKey = patternNameToI18nKeyMap.get(finding.pattern_name) || finding.pattern_name;
              return (
                <div key={index} id={`finding-card-${finding.displayIndex}`} className={`bg-gray-50 border ${color.border} rounded-lg shadow-md overflow-hidden`}>
                  <div className={`p-4 border-b ${color.border}`} style={{ backgroundColor: color.hex }}>
                    <h4 className={`text-l font-bold ${color.text} uppercase`}>{t(i18nKey)}</h4>
                  </div>
                  <div className="p-4 space-y-3">
                    <div><h5 className="font-semibold text-gray-600 mb-1">{t('report_quote_label')}</h5><blockquote className={`italic p-3 rounded-md border-l-4 ${color.border}`} style={{ backgroundColor: color.hex }}><p className={color.text}>"{finding.specific_quote}"</p></blockquote></div>
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