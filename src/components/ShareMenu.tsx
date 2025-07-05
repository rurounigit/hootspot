// src/components/ShareMenu.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { GeminiAnalysisResponse, GeminiFinding } from '../types';
import { ShareIcon } from '../constants';
import { useTranslation } from '../i18n';
import { LEXICON_SECTIONS_BY_KEY, fullNameToKeyMap, patternNameToI18nKeyMap } from '../lexicon-structure';

// Define the type for the color info
type ColorInfo = { hex: string; border: string; text: string };

interface ShareMenuProps {
  analysis: GeminiAnalysisResponse;
  sourceText: string | null;
  profileData: any[];
  highlightData: any[];
  patternColorMap: Map<string, ColorInfo>;
}

const ShareMenu: React.FC<ShareMenuProps> = ({ analysis, sourceText, profileData, highlightData, patternColorMap }) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // FIX: Group findings by their stable i18n category key, not the translated string.
  const findingsByCategory = useMemo(() => {
    const keyToCategoryKeyMap = new Map<string, string>();
    Object.entries(LEXICON_SECTIONS_BY_KEY).forEach(([categoryKey, patterns]) => {
      Object.keys(patterns).forEach(key => keyToCategoryKeyMap.set(key, categoryKey));
    });

    return analysis.findings.reduce((acc, finding) => {
      const simpleKey = fullNameToKeyMap.get(finding.pattern_name);
      const categoryKey = simpleKey ? (keyToCategoryKeyMap.get(simpleKey) || 'Uncategorized') : 'Uncategorized';
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

    const chartImages: Record<string, string> = {};
    for (const section of profileData) {
      if (section.hasFindings) {
        const chartElement = document.getElementById(`chart-container-${section.translatedTitle}`);
        if (chartElement) {
          try {
            const canvas = await html2canvas(chartElement, { scale: 2, backgroundColor: null });
            chartImages[section.translatedTitle] = canvas.toDataURL('image/png');
          } catch (error) {
            console.error("Failed to capture chart image:", error);
          }
        }
      }
    }

    const patternColorMapObject = Object.fromEntries(patternColorMap.entries());

    const patternNameTranslations = Object.fromEntries(
        Array.from(patternNameToI18nKeyMap.entries()).map(([originalName, i18nKey]) => [
            originalName,
            t(i18nKey)
        ])
    );

    // FIX: Create a translations map for the category keys to pass to the PDF generator.
    const categoryNameTranslations = Object.fromEntries(
        Object.keys(LEXICON_SECTIONS_BY_KEY).map(key => [key, t(key)])
    );

    const dataForPdf = {
      analysis: { ...analysis, findingsByCategory },
      sourceText,
      highlightData,
      chartImages,
      profileData,
      patternColorMap: patternColorMapObject,
      translations: {
        reportTitle: t('pdf_report_title'),
        summaryTitle: t('report_summary_title'),
        highlightedTextTitle: t('report_highlighted_text_title'),
        profileTitle: t('report_profile_title'),
        detectedPatternsTitle: t('report_detected_patterns_title'),
        quoteLabel: t('report_quote_label'),
        explanationLabel: t('report_explanation_label'),
        pageNumber: t('pdf_page_number'),
        patternNames: patternNameTranslations,
        categoryNames: categoryNameTranslations, // Pass the category translations
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
    // FIX: Translate category keys from i18n keys to human-readable names for the export.
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
    const detectedPatterns = [...new Set(analysis.findings.map(f => t(patternNameToI18nKeyMap.get(f.pattern_name) || f.pattern_name)))];
    let patternsText = detectedPatterns.slice(0, 2).join(', ');
    let tweetText = t('share_twitter_text', { patterns: patternsText, summary: summary });

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
        title={t('share_menu_tooltip')}
      >
        {isGenerating ? (
          <div className="spinner w-5 h-5 border-t-blue-600"></div>
        ) : (
          <ShareIcon className="w-5 h-5" />
        )}
      </button>

      {isMenuOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
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