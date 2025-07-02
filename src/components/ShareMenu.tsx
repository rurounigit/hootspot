// src/components/ShareMenu.tsx

import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { GeminiAnalysisResponse } from '../types';
import { ShareIcon } from '../constants';
import { useTranslation } from '../i18n';

interface ShareMenuProps {
  analysis: GeminiAnalysisResponse;
  sourceText: string | null;
  reportRef: React.RefObject<HTMLDivElement>;
}

const ShareMenu: React.FC<ShareMenuProps> = ({ analysis, sourceText, reportRef }) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
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
    if (reportRef.current) {
      const reportElement = reportRef.current;
      // Temporarily hide the share menu from the DOM before capturing
      const shareMenuElement = reportElement.querySelector('.share-menu-container');
      if (shareMenuElement) {
        (shareMenuElement as HTMLElement).style.display = 'none';
      }

      html2canvas(reportElement, {
        scale: 2, // Higher scale for better resolution
        useCORS: true,
        backgroundColor: '#ffffff', // Set a background color
      }).then((canvas) => {
        // Restore the share menu's visibility
        if (shareMenuElement) {
            (shareMenuElement as HTMLElement).style.display = 'block';
        }
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('HootSpot_Analysis_Report.pdf');
      });
    }
    setIsMenuOpen(false);
  };

  const handleJsonDownload = () => {
    const jsonString = JSON.stringify({ analysis, sourceText }, null, 2);
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

    // Truncate if too long for Twitter
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
            <li>
              <button
                onClick={handlePdfDownload}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Download PDF
              </button>
            </li>
            <li>
              <button
                onClick={handleJsonDownload}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Download JSON
              </button>
            </li>
            <li>
              <button
                onClick={handleTwitterShare}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Share on X (Twitter)
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ShareMenu;