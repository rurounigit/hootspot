// src/components/analysis/HighlightedText.tsx

import React, { useState } from 'react';
import { PatternFinding } from '../../types/api';
import { useTranslation } from '../../i18n';

const UNIFORM_HIGHLIGHT_COLOR = 'bg-red-200 dark:bg-red-800/60';

interface HighlightedTextProps {
  text: string;
  matches: { start: number; end: number; findings: (PatternFinding & { displayIndex: number })[] }[];
  patternColorMap: Map<string, string>;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({ text, matches, patternColorMap }) => {
  const { t } = useTranslation();
  const [tooltip, setTooltip] = useState({ visible: false, title: '', description: '', x: 0, y: 0, color: '', textColor: '#fff' });

  if (!matches || matches.length === 0) return <p className="whitespace-pre-wrap leading-relaxed">{text}</p>;

  const handlePillClick = (displayIndex: number) => {
    const element = document.getElementById(`finding-card-${displayIndex}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-indigo-100', 'dark:bg-indigo-800', 'transition-colors', 'duration-200');
      setTimeout(() => {
        element.classList.remove('bg-indigo-100', 'dark:bg-indigo-800');
      }, 800);
    }
  };

  const handlePillMouseOver = (event: React.MouseEvent, finding: PatternFinding & { displayIndex: number }) => {
    const color = patternColorMap.get(finding.pattern_name) || '#ccc';
    setTooltip({ visible: true, title: finding.display_name, description: t(finding.category), x: event.clientX, y: event.clientY, color: color, textColor: '#fff' });
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
    segments.push(<span key={`match-${matchIndex}`} className="inline">{pills}<mark className={`${UNIFORM_HIGHLIGHT_COLOR} p-0.5 rounded-sm text-gray-800 dark:text-gray-50`}>{text.substring(match.start, match.end).trimEnd()}</mark></span>);
    lastIndex = match.end;
  });

  if (lastIndex < text.length) { segments.push(text.substring(lastIndex)); }

  return (
    <>
      {tooltip.visible && (
        <div className="fixed max-w-xs px-3 py-2 rounded-lg shadow-xl text-sm pointer-events-none z-50" style={{ top: tooltip.y + 15, left: tooltip.x + 15, backgroundColor: tooltip.color, color: tooltip.textColor, border: `1px solid rgba(0,0,0,0.2)` }}>
          <strong className="font-bold block">{tooltip.title}</strong>
          {tooltip.description && <p className="mt-1">{tooltip.description}</p>}
        </div>
      )}
      <p className="whitespace-pre-wrap leading-relaxed">{segments.map((segment, index) => <React.Fragment key={index}>{segment}</React.Fragment>)}</p>
    </>
  );
};

export default HighlightedText;
