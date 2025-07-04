// src/components/ShareMenu.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { GeminiAnalysisResponse, GeminiFinding } from '../types';
import { ShareIcon } from '../constants';
import { useTranslation } from '../i18n';
import { LEXICON_SECTIONS_BY_KEY, fullNameToKeyMap } from '../lexicon-structure';

interface ShareMenuProps {
  analysis: GeminiAnalysisResponse;
  sourceText: string | null;
  profileData: any[];
  highlightData: any[];
}

const ShareMenu: React.FC<ShareMenuProps> = ({ analysis, sourceText, profileData, highlightData }) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const findingsByCategory = useMemo(() => {
    const keyToCategoryMap = new Map<string, string>();
    Object.entries(LEXICON_SECTIONS_BY_KEY).forEach(([category, patterns]) => {
      Object.keys(patterns).forEach(key => keyToCategoryMap.set(key, category));
    });
    return analysis.findings.reduce((acc, finding) => {
      const simpleKey = fullNameToKeyMap.get(finding.pattern_name);
      const category = simpleKey ? keyToCategoryMap.get(simpleKey) || 'Uncategorized' : 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(finding);
      return acc;
    }, {} as Record<string, GeminiFinding[]>);
  }, [analysis.findings]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cleanup = () => {
    if (iframeRef.current) {
      document.body.removeChild(iframeRef.current);
      iframeRef.current = null;
    }
    window.removeEventListener('message', handlePdfMessage);
    setIsGenerating(false);
  };

  const handlePdfMessage = (event: MessageEvent) => {
    if (event.source !== iframeRef.current?.contentWindow) {
      return;
      }

    const { type, blob, error } = event.data;

    if (type === 'PDF_GENERATED' && blob) {
      // Create a short-lived, temporary URL for the blob
      const objectUrl = URL.createObjectURL(blob);

      // Send this short URL to the background script, avoiding message size limits
      chrome.runtime.sendMessage({ type: 'DOWNLOAD_PDF', url: objectUrl });

      // Revoke the URL after a short delay to give the download API time to access it.
      // This prevents memory leaks.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

    } else if (type === 'PDF_ERROR') {
      console.error("PDF generation failed in sandbox:", error);
    }

    cleanup();
  };

  const handlePdfDownload = async () => {
    setIsMenuOpen(false);
    setIsGenerating(true);

    const chartImages: Record<string, string> = {};
    for (const section of profileData) {
      if (section.hasFindings) {
        const chartElement = document.getElementById(`chart-container-${section.title}`);
        if (chartElement) {
          try {
            const canvas = await html2canvas(chartElement, { scale: 2, backgroundColor: null });
            chartImages[section.title] = canvas.toDataURL('image/png');
          } catch (error) {
            console.error("Failed to capture chart image:", error);
          }
        }
      }
    }

    const dataForPdf = {
      analysis: { ...analysis, findingsByCategory },
      sourceText,
      highlightData,
      chartImages,
      profileData,
    };

    window.addEventListener('message', handlePdfMessage);

    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('pdf-generator.html');
    iframe.style.display = 'none';
    iframeRef.current = iframe;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow?.postMessage({ type: 'GENERATE_PDF', data: dataForPdf }, '*');
    };
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
    chrome.downloads.download({ url: url, filename: 'HootSpot_Analysis_Report.json' });
    // Revoke URL to prevent memory leak
    setTimeout(() => URL.revokeObjectURL(url), 100);
    setIsMenuOpen(false);
  };

  const handleTwitterShare = () => {
    // This function remains the same
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
        disabled={isGenerating}
        className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-wait"
        title="Share or Download Report"
      >
        {isGenerating ? (
          <div className="spinner w-5 h-5 border-t-blue-600"></div>
        ) : (
          <ShareIcon className="w-5 h-5" />
        )}
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