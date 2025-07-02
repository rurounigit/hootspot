// src/components/ShareMenu.tsx

import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { GeminiAnalysisResponse } from '../types';
import { ShareIcon } from '../constants';
import { useTranslation } from '../i18n';
import { LEXICON_SECTIONS_BY_KEY, fullNameToKeyMap } from '../lexicon-structure';
import PrintableReport from './PrintableReport'; // Import the new component

interface ShareMenuProps {
  analysis: GeminiAnalysisResponse;
  sourceText: string | null;
  // Pass down the data needed by the printable report
  profileData: any[];
  highlightData: any[];
  patternColorMap: Map<string, any>;
}

const keyToCategoryMap = new Map<string, string>();
Object.entries(LEXICON_SECTIONS_BY_KEY).forEach(([category, patterns]) => {
  Object.keys(patterns).forEach(key => {
    keyToCategoryMap.set(key, category);
  });
});

const ShareMenu: React.FC<ShareMenuProps> = ({ analysis, sourceText, profileData, highlightData, patternColorMap }) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false); // State to control rendering
  const menuRef = useRef<HTMLDivElement>(null);
  const printableRef = useRef<HTMLDivElement>(null); // Ref for the hidden component

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

  const generateStructuredReportData = () => {
    const detailedFindings = analysis.findings.map(finding => {
      const simpleKey = fullNameToKeyMap.get(finding.pattern_name);
      const category = simpleKey ? keyToCategoryMap.get(simpleKey) : "Uncategorized";
      return {
        patternName: finding.pattern_name,
        category: category,
        quote: finding.specific_quote,
        explanation: finding.explanation,
      };
    });
    return {
      reportTitle: "HootSpot AI Analysis Report",
      analysisSummary: analysis.analysis_summary,
      sourceText: sourceText,
      detailedFindings: detailedFindings,
    };
  };

  const handlePdfDownload = () => {
    setIsMenuOpen(false);
    setIsGeneratingPdf(true); // Render the printable component

    // Use a timeout to ensure the component has rendered before we capture it
    setTimeout(() => {
      if (printableRef.current) {
        html2canvas(printableRef.current, {
          scale: 2,
          useCORS: true,
          windowWidth: printableRef.current.scrollWidth,
          windowHeight: printableRef.current.scrollHeight
        }).then((canvas) => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
          });
          pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
          pdf.save('HootSpot_Analysis_Report.pdf');
          setIsGeneratingPdf(false); // Hide the printable component after capture
        });
      } else {
        setIsGeneratingPdf(false);
      }
    }, 100); // 100ms delay
  };

  const handleJsonDownload = () => {
    const structuredData = generateStructuredReportData();
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
    // ... (this function remains the same)
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
    <>
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
            {/* ... Dropdown menu items ... */}
            <ul className="py-1">
                <li><button onClick={handlePdfDownload} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Download PDF</button></li>
                <li><button onClick={handleJsonDownload} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Download JSON</button></li>
                <li><button onClick={handleTwitterShare} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Share on X (Twitter)</button></li>
            </ul>
          </div>
        )}
      </div>

      {/* Conditionally render the hidden report for PDF generation */}
      {isGeneratingPdf && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <PrintableReport
            ref={printableRef}
            analysis={analysis}
            sourceText={sourceText}
            profileData={profileData}
            highlightData={highlightData}
            patternColorMap={patternColorMap}
          />
        </div>
      )}
    </>
  );
};

export default ShareMenu;