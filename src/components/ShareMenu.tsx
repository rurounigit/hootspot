// src/components/ShareMenu.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { GeminiAnalysisResponse, GeminiFinding } from '../types';
import { ShareIcon } from '../constants';
import { useTranslation } from '../i18n';
import ExportableBubbleChart from './ExportableBubbleChart';
import { PDF_CONFIG } from '../pdf-config';

// Define the interfaces for props
interface BubbleData {
  id: string; name: string; strength: number; category: string; color: string; radius: number;
}
interface ShareMenuProps {
  analysis: GeminiAnalysisResponse;
  sourceText: string | null;
  highlightData: any[];
  patternColorMap: Map<string, string>;
  bubbleChartData: BubbleData[]; // This prop is now required
}

const ShareMenu: React.FC<ShareMenuProps> = ({ analysis, sourceText, highlightData, patternColorMap, bubbleChartData }) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const pdfDataRef = useRef<any>(null);
  const pdfFilenameRef = useRef<string | null>(null); // Ref to hold the dynamic filename

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    };
    const handlePdfMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const { type, blob } = event.data;
      if (type === 'PDF_SANDBOX_READY') {
        if (iframeRef.current?.contentWindow && pdfDataRef.current) {
          iframeRef.current.contentWindow.postMessage({ type: 'GENERATE_PDF', data: pdfDataRef.current }, '*');
        }
      } else if (type === 'PDF_GENERATED' && blob) {
        const objectUrl = URL.createObjectURL(blob);
        // Use the filename from the ref
        chrome.runtime.sendMessage({ type: 'DOWNLOAD_PDF', url: objectUrl, filename: pdfFilenameRef.current });
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        cleanup();
      } else if (type === 'PDF_CRASH_REPORT') {
        console.error("PDF generation failed in sandbox:", event.data.payload);
        cleanup();
      }
    };

    window.addEventListener('message', handlePdfMessage);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('message', handlePdfMessage);
      document.removeEventListener('mousedown', handleClickOutside);
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (iframeRef.current) {
      document.body.removeChild(iframeRef.current);
      iframeRef.current = null;
    }
    pdfDataRef.current = null;
    pdfFilenameRef.current = null; // Clean up the ref
    setIsGenerating(false);
  };

  const handlePdfDownload = async () => {
    setIsMenuOpen(false);
    setIsGenerating(true);

    // Generate a unique, timestamp-based ID for the filename
    const now = new Date();
    const pad = (num: number) => num.toString().padStart(2, '0');
    const reportId = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    pdfFilenameRef.current = `HootSpot_Analysis_Report_${reportId}.pdf`;

    let chartImage: string | null = null;

    // Create a hidden container for the off-screen rendering
    const hiddenContainer = document.createElement('div');
    hiddenContainer.style.position = 'absolute';
    hiddenContainer.style.left = '-9999px';
    hiddenContainer.style.width = '600px';
    hiddenContainer.style.height = '450px';
    hiddenContainer.style.backgroundColor = PDF_CONFIG.CHART_BACKGROUND_COLOR;
    document.body.appendChild(hiddenContainer);

    const root = createRoot(hiddenContainer);

    // Render the export-only chart into the hidden div
    root.render(
      <ExportableBubbleChart
        data={bubbleChartData}
        width={600}
        height={450}
      />
    );

    // Wait for rendering to complete
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      const canvas = await html2canvas(hiddenContainer, {
        scale: PDF_CONFIG.CHART_IMAGE_SCALE, // <-- USE CONFIG VALUE
        backgroundColor: null // Let the container's color be used
      });
      chartImage = canvas.toDataURL('image/png');
    } catch (error) {
      console.error("Failed to capture chart image:", error);
    } finally {
      // Clean up gracefully
      root.unmount();
      document.body.removeChild(hiddenContainer);
    }

    pdfDataRef.current = {
      analysis,
      sourceText,
      highlightData,
      chartImage,
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

    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('pdf-generator.html');
    iframe.style.display = 'none';
    iframeRef.current = iframe;
    document.body.appendChild(iframe);
  };

  const handleJsonDownload = () => {
    // Generate a unique, timestamp-based ID
    const now = new Date();
    const pad = (num: number) => num.toString().padStart(2, '0');
    const reportId = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const filename = `HootSpot_Analysis_Report_${reportId}.json`;

    const dataToSave = {
      reportId: reportId,
      sourceText: sourceText,
      analysisResult: analysis
    };
    const jsonString = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({ url: url, filename: filename });
    setTimeout(() => URL.revokeObjectURL(url), 100);
    setIsMenuOpen(false);
  };

  const handleTwitterShare = () => {
    // This logic remains unchanged from your working version
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
    <div className="relative share-menu-container ml-3" ref={menuRef}>
      <button onClick={() => setIsMenuOpen(!isMenuOpen)} disabled={isGenerating} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-wait" title={t('share_menu_tooltip')}>
        {isGenerating ? <div className="spinner w-5 h-5 border-t-blue-600"></div> : <ShareIcon className="w-5 h-5 pr-[3px]" />}
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