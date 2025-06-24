
import React, { useState } from 'react';
import { GeminiFinding } from '../types';

// Helper to escape regex special characters
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
};

// Define color styles for each known pattern for consistency
const PATTERN_SPECIFIC_COLORS: Record<string, { background: string, text: string, border: string }> = {
  // Section 1: Interpersonal & Psychological Manipulation Tactics
  "Guilt Tripping": { background: 'bg-yellow-200', text: 'text-yellow-800', border: 'border-yellow-400' },
  "Gaslighting": { background: 'bg-blue-200', text: 'text-blue-800', border: 'border-blue-400' },
  "Threatening / Coercion": { background: 'bg-red-200', text: 'text-red-800', border: 'border-red-400' },
  "Invalidation / Minimizing": { background: 'bg-purple-200', text: 'text-purple-800', border: 'border-purple-400' },
  "Deflection / Shifting Blame": { background: 'bg-pink-200', text: 'text-pink-800', border: 'border-pink-400' },
  "DARVO (Deny, Attack, and Reverse Victim and Offender)": { background: 'bg-orange-200', text: 'text-orange-800', border: 'border-orange-400' },
  "Moving the Goalposts": { background: 'bg-teal-200', text: 'text-teal-800', border: 'border-teal-400' },
  "Love Bombing": { background: 'bg-emerald-200', text: 'text-emerald-800', border: 'border-emerald-400' },
  "Projection": { background: 'bg-sky-200', text: 'text-sky-800', border: 'border-sky-400' },
  "Splitting (or Black-and-White Thinking)": { background: 'bg-amber-200', text: 'text-amber-800', border: 'border-amber-400' },

  // Section 2: Covert Aggression & Indirect Control
  "The Backhanded Compliment": { background: 'bg-violet-200', text: 'text-violet-800', border: 'border-violet-400' },
  "Weaponized Incompetence": { background: 'bg-green-200', text: 'text-green-800', border: 'border-green-400' },
  "The Silent Treatment (Stonewalling)": { background: 'bg-slate-200', text: 'text-slate-800', border: 'border-slate-400' },
  
  // Section 3: Sociopolitical & Rhetorical Mechanisms of Control
  "The Straw Man Fallacy": { background: 'bg-stone-200', text: 'text-stone-800', border: 'border-stone-400' },
  "The Co-optation of Dissent: \"Radical\" Language for Status Quo Ends": { background: 'bg-indigo-200', text: 'text-indigo-800', border: 'border-indigo-400' },
  "Redefining the Terrain: The \"Culture War\" as Economic Distraction": { background: 'bg-lime-200', text: 'text-lime-800', border: 'border-lime-400' },
  "The Foreclosure of Alternatives: \"There Is No Alternative\" (TINA) 2.0": { background: 'bg-cyan-200', text: 'text-cyan-800', border: 'border-cyan-400' },
  "Manufacturing Reflexive Impotence: \"Both Sides\" and Information Overload": { background: 'bg-fuchsia-200', text: 'text-fuchsia-800', border: 'border-fuchsia-400' },
  "The Personalization of Systemic Problems": { background: 'bg-rose-200', text: 'text-rose-800', border: 'border-rose-400' },
  "Dog-Whistling": { background: 'bg-zinc-200', text: 'text-zinc-800', border: 'border-zinc-400' },
  "Euphemism & Jargon": { background: 'bg-neutral-200', text: 'text-neutral-800', border: 'border-neutral-400' },
};

const DEFAULT_HIGHLIGHT_COLOR = { background: 'bg-gray-300', text: 'text-gray-800', border: 'border-gray-500' };

interface HighlightedSourceTextProps {
  sourceText: string | null;
  findings: GeminiFinding[] | null;
}

interface TooltipState {
  visible: boolean;
  content: string;
  x: number;
  y: number;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const HighlightedSourceText: React.FC<HighlightedSourceTextProps> = ({ sourceText, findings }) => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  if (!sourceText) return null;
  if (!findings || findings.length === 0) {
    return <p className="whitespace-pre-wrap text-gray-700">{sourceText}</p>;
  }

  const findingsMap = new Map<string, GeminiFinding>();
  const originalQuotesMap = new Map<string, string>();

  findings.forEach(finding => {
    if (finding.specific_quote) {
      const trimmedQuote = finding.specific_quote.trim();
      if (trimmedQuote) {
        const lowerQuote = trimmedQuote.toLowerCase();
        if (!findingsMap.has(lowerQuote)) {
          findingsMap.set(lowerQuote, finding);
          originalQuotesMap.set(lowerQuote, trimmedQuote);
        }
      }
    }
  });

  const uniqueOriginalCasedQuotes = Array.from(originalQuotesMap.values());
  uniqueOriginalCasedQuotes.sort((a, b) => b.length - a.length);

  if (uniqueOriginalCasedQuotes.length === 0) {
    return <p className="whitespace-pre-wrap text-gray-700">{sourceText}</p>;
  }

  const regexParts = uniqueOriginalCasedQuotes.map(quote => escapeRegExp(quote));
  const regex = new RegExp(`(${regexParts.join('|')})`, 'gi');
  
  const parts = sourceText.split(regex);

  const handleMouseEnter = (event: React.MouseEvent<HTMLSpanElement>, finding: GeminiFinding, colorStyle: typeof DEFAULT_HIGHLIGHT_COLOR) => {
    // Normalize pattern_name (strip leading "N. ") for display
    let displayPatternName = finding.pattern_name;
    const patternNameMatch = finding.pattern_name.match(/^\d+\.\s*(.*)/);
    if (patternNameMatch && patternNameMatch[1]) {
      displayPatternName = patternNameMatch[1];
    }

    setTooltip({
      visible: true,
      content: displayPatternName,
      x: event.clientX,
      y: event.clientY,
      bgColor: colorStyle.background,
      textColor: colorStyle.text,
      borderColor: colorStyle.border,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };
  
  const handleMouseMove = (event: React.MouseEvent<HTMLSpanElement>) => {
    if (tooltip && tooltip.visible) {
      setTooltip(prev => prev ? {...prev, x: event.clientX, y: event.clientY } : null);
    }
  };


  return (
    <>
      <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
        {parts.map((part, index) => {
          if (part === undefined || part === null || part === '') {
              return null; 
          }

          const partLower = part.toLowerCase();
          const finding = findingsMap.get(partLower);

          if (finding && originalQuotesMap.has(partLower) && part.trim() !== "") {
            let colorKey = finding.pattern_name;
            const patternNameMatch = finding.pattern_name.match(/^\d+\.\s*(.*)/);
            if (patternNameMatch && patternNameMatch[1]) {
              colorKey = patternNameMatch[1];
            }
            const colorStyle = PATTERN_SPECIFIC_COLORS[colorKey] || DEFAULT_HIGHLIGHT_COLOR;
            
            return (
              <span
                key={index}
                className={`${colorStyle.background} ${colorStyle.text} p-0.5 rounded-sm mx-px font-medium`}
                onMouseEnter={(e) => handleMouseEnter(e, finding, colorStyle)}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
              >
                {part}
              </span>
            );
          }
          return <React.Fragment key={index}>{part}</React.Fragment>;
        })}
      </p>
      {tooltip && tooltip.visible && (
        <div
          style={{
            top: tooltip.y + 15, // Offset from cursor
            left: tooltip.x + 10, // Offset from cursor
          }}
          className={`fixed ${tooltip.bgColor} ${tooltip.textColor} ${tooltip.borderColor} border text-xs font-medium px-2 py-1 rounded-md shadow-lg z-50 pointer-events-none transition-opacity duration-100 opacity-95`}
        >
          {tooltip.content}
        </div>
      )}
    </>
  );
};

export default HighlightedSourceText;
