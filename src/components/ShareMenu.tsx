// src/components/ShareMenu.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { GeminiAnalysisResponse, GeminiFinding } from '../types';
import { ShareIcon } from '../constants';
import { useTranslation } from '../i18n';

interface ShareMenuProps {
  analysis: GeminiAnalysisResponse;
  sourceText: string | null;
  highlightData: any[];
  patternColorMap: Map<string, string>;
}

const ShareMenu: React.FC<ShareMenuProps> = ({ analysis, sourceText, highlightData, patternColorMap }) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const findingsByCategory = useMemo(() => {
    return analysis.findings.reduce((acc, finding) => {
      const categoryKey = finding.category || 'Uncategorized';
      if (!acc[categoryKey]) acc[categoryKey] = [];
      acc[categoryKey].push(finding);
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
      const objectUrl = URL.createObjectURL(blob);
      chrome.runtime.sendMessage({ type: 'DOWNLOAD_PDF', url: objectUrl });
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } else if (type === 'PDF_ERROR') {
      console.error("PDF generation failed in sandbox:", error);
    }

    cleanup();
  };

  const handlePdfDownload = async () => {
    setIsMenuOpen(false);
    setIsGenerating(true);

    let chartImage: string | null = null;
    const chartElement = document.getElementById('bubble-chart-container');
    if (chartElement) {
        try {
            const canvas = await html2canvas(chartElement, { scale: 2, backgroundColor: '#f9fafb' });
            chartImage = canvas.toDataURL('image/png');
        } catch (error) {
            console.error("Failed to capture chart image:", error);
        }
    }

    const dataForPdf = {
      analysis: { ...analysis, findingsByCategory },
      sourceText,
      highlightData,
      chartImage: chartImage,
      patternColorMap: Object.fromEntries(patternColorMap.entries()),
      translations: {
        reportTitle: t('pdf_report_title'),
        summaryTitle: t('report_summary_title'),
        highlightedTextTitle: t('report_highlighted_text_title'),
        profileTitle: t('report_profile_title'),
        detectedPatternsTitle: t('report_detected_patterns_title'),
        quoteLabel: t('report_quote_label'),
        explanationLabel: t('report_explanation_label'),
        pageNumber: t('pdf_page_number'),
        categoryNames: {
            'category_interpersonal_psychological': t('category_interpersonal_psychological'),
            'category_covert_indirect_control': t('category_covert_indirect_control'),
            'category_sociopolitical_rhetorical': t('category_sociopolitical_rhetorical'),
        }
      }
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
    const translatedFindingsByCategory = Object.entries(findingsByCategory).reduce((acc, [categoryKey, findings]) => {
        acc[t(categoryKey) || categoryKey] = findings;
        return acc;
    }, {} as Record<string, GeminiFinding[]>);

    const structuredData = {
      reportTitle: "HootSpot AI Analysis Report",
      analysisSummary: analysis.analysis_summary,
      sourceText: sourceText,
      findingsByCategory: translatedFindingsByCategory,
    };
    const jsonString = JSON.stringify(structuredData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({ url: url, filename: 'HootSpot_Analysis_Report.json' });
    setTimeout(() => URL.revokeObjectURL(url), 100);
    setIsMenuOpen(false);
  };

  const handleTwitterShare = () => {
    const summary = analysis.analysis_summary;
    const detectedPatterns = [...new Set(analysis.findings.map(f => f.display_name))];
    let patternsText = detectedPatterns.slice(0, 2).join(', ');

    let tweetText = t('share_twitter_text', { summary: summary, patterns: patternsText });
    if (tweetText.length > 260) {
      tweetText = `HootSpot: "${summary}" Detected: ${patternsText}...`;
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
        title={t('share_menu_tooltip')}
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
            <li><button onClick={handlePdfDownload} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{t('share_menu_pdf')}</button></li>
            <li><button onClick={handleJsonDownload} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{t('share_menu_json')}</button></li>
            <li><button onClick={handleTwitterShare} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{t('share_menu_twitter')}</button></li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ShareMenu;