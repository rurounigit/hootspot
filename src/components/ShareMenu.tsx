// src/components/ShareMenu.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import { GeminiAnalysisResponse, GeminiFinding } from '../types';
import { ShareIcon } from '../constants';
import { useTranslation } from '../i18n';
import { LEXICON_SECTIONS_BY_KEY, fullNameToKeyMap } from '../lexicon-structure';

interface ShareMenuProps {
  analysis: GeminiAnalysisResponse;
  sourceText: string | null;
  highlightData: any[];
  patternColorMap: Map<string, any>;
}

const keyToCategoryMap = new Map<string, string>();
Object.entries(LEXICON_SECTIONS_BY_KEY).forEach(([category, patterns]) => {
  Object.keys(patterns).forEach(key => {
    keyToCategoryMap.set(key, category);
  });
});

const ShareMenu: React.FC<ShareMenuProps> = ({ analysis, sourceText, highlightData, patternColorMap }) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const findingsByCategory = useMemo(() => {
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePdfDownload = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    let y = 0;

    // --- PDF DRAWING HELPER FUNCTIONS ---

    const drawTextAndCalcHeight = (text: string, x: number, startY: number, maxWidth: number, options: any = {}) => {
        doc.setFont(options.font || 'helvetica', options.style || 'normal');
        doc.setFontSize(options.fontSize || 10);
        doc.setTextColor(options.textColor || '#000000');

        const lines = doc.splitTextToSize(text, maxWidth);
        const textHeight = doc.getTextDimensions(lines).h;

        // Check for page break BEFORE drawing
        if (startY + textHeight > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            startY = margin;
        }

        doc.text(lines, x, startY);
        return startY + textHeight;
    };

    const drawHighlightedText = (text: string, ranges: any[], startY: number) => {
        let currentY = startY;
        const fontSize = 10;
        const lineHeight = fontSize * 1.5;
        doc.setFontSize(fontSize);
        doc.setTextColor('#374151');

        const sortedRanges = ranges.sort((a, b) => a.start - b.start);
        let segments: { text: string; highlighted: boolean }[] = [];
        let lastIndex = 0;

        sortedRanges.forEach(range => {
            if (range.start > lastIndex) {
                segments.push({ text: text.substring(lastIndex, range.start), highlighted: false });
            }
            segments.push({ text: text.substring(range.start, range.end), highlighted: true });
            lastIndex = range.end;
        });
        if (lastIndex < text.length) {
            segments.push({ text: text.substring(lastIndex), highlighted: false });
        }

        let currentX = margin;
        segments.forEach(segment => {
            const words = segment.text.split(/(\s+)/); // Split by space but keep it
            words.forEach(word => {
                if (word.trim() === '') {
                    currentX += doc.getStringUnitWidth(word) * fontSize / doc.internal.scaleFactor;
                    return;
                }
                const wordWidth = doc.getStringUnitWidth(word) * fontSize / doc.internal.scaleFactor;
                if (currentX + wordWidth > pageWidth - margin) {
                    currentY += lineHeight;
                    currentX = margin;
                }
                if (segment.highlighted) {
                    doc.setFillColor('#FECACA');
                    doc.rect(currentX, currentY - fontSize + 2, wordWidth, fontSize + 2, 'F');
                }
                doc.text(word, currentX, currentY);
                currentX += wordWidth;
            });
        });
        return currentY + lineHeight;
    };

    // --- START BUILDING THE PDF ---

    y = margin + 20;
    doc.setFont('helvetica', 'bold');
    y = drawTextAndCalcHeight("HootSpot AI Analysis Report", pageWidth / 2, y, contentWidth, { fontSize: 24, align: 'center' });
    y += 10;
    doc.setDrawColor('#DDDDDD');
    doc.line(margin, y, pageWidth - margin, y);
    y += 20;

    y = drawTextAndCalcHeight("Analysis Summary", margin, y, contentWidth, { fontSize: 16, style: 'bold', textColor: '#1F2937' });
    y += 5;
    y = drawTextAndCalcHeight(analysis.analysis_summary, margin, y, contentWidth, { fontSize: 11, textColor: '#374151' });
    y += 20;

    if (sourceText) {
        y = drawTextAndCalcHeight("Highlighted Source Text", margin, y, contentWidth, { fontSize: 16, style: 'bold', textColor: '#1F2937' });
        y += 10;
        y = drawHighlightedText(sourceText, highlightData, y);
        y += 20;
    }

    y = drawTextAndCalcHeight("Detected Patterns", margin, y, contentWidth, { fontSize: 16, style: 'bold', textColor: '#1F2937' });

    Object.entries(findingsByCategory).forEach(([category, findings]) => {
        y += 20;
        y = drawTextAndCalcHeight(category, margin, y, contentWidth, { fontSize: 14, style: 'bold', textColor: '#4B5563' });

        findings.forEach(finding => {
            const color = patternColorMap.get(finding.pattern_name) || { hex: '#F9FAFB' };

            // Estimate card height to check for page break
            const quoteHeight = doc.getTextDimensions(doc.splitTextToSize(finding.specific_quote, contentWidth - 20)).h;
            const explanationHeight = doc.getTextDimensions(doc.splitTextToSize(finding.explanation, contentWidth - 20)).h;
            const cardHeight = 60 + quoteHeight + explanationHeight;

            if (y + cardHeight > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                y = margin;
            }

            y += 10;
            doc.setFillColor(color.hex);
            doc.roundedRect(margin, y, contentWidth, cardHeight, 5, 5, 'F');

            let innerY = y + 15;
            innerY = drawTextAndCalcHeight(finding.pattern_name, margin + 10, innerY, contentWidth - 20, { fontSize: 11, style: 'bold' });
            innerY += 10;

            innerY = drawTextAndCalcHeight("Specific Quote:", margin + 10, innerY, contentWidth - 20, { fontSize: 9, style: 'bold', textColor: '#4B5563' });
            innerY = drawTextAndCalcHeight(`"${finding.specific_quote}"`, margin + 10, innerY, contentWidth - 20, { fontSize: 10, style: 'italic' });
            innerY += 10;

            innerY = drawTextAndCalcHeight("Explanation:", margin + 10, innerY, contentWidth - 20, { fontSize: 9, style: 'bold', textColor: '#4B5563' });
            innerY = drawTextAndCalcHeight(finding.explanation, margin + 10, innerY, contentWidth - 20, { fontSize: 10 });

            y += cardHeight + 10;
        });
    });

    doc.save('HootSpot_Analysis_Report.pdf');
    setIsMenuOpen(false);
  };

  const handleJsonDownload = () => {
    const structuredData = {
      reportTitle: "HootSpot AI Analysis Report",
      analysisSummary: analysis.analysis_summary,
      sourceText: sourceText,
      findingsByCategory: findingsByCategory,
    };
    const jsonString = JSON.stringify(structuredData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'HootSpot_Analysis_Report.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsMenuOpen(false);
  };

  const handleTwitterShare = () => {
    const summary = analysis.analysis_summary;
    const detectedPatterns = [...new Set(analysis.findings.map(f => f.pattern_name))];
    let tweetText = `I analyzed a text with HootSpot AI and found these patterns: ${detectedPatterns.slice(0, 2).join(', ')}. Summary: "${summary}"`;
    if (tweetText.length > 260) {
        tweetText = `${tweetText.substring(0, 257)}...`;
    }
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&hashtags=HootSpotAI,CriticalThinking`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    setIsMenuOpen(false);
  };

  return (
    <div className="relative share-menu-container" ref={menuRef}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
        title="Share or Download Report"
      >
        <ShareIcon className="w-5 h-5" />
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
          <ul className="py-1">
            <li><button onClick={handlePdfDownload} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Download PDF</button></li>
            <li><button onClick={handleJsonDownload} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Download JSON</button></li>
            <li><button onClick={handleTwitterShare} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Share on X (Twitter)</button></li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ShareMenu;