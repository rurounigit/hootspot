// src/components/ShareMenu.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { GeminiAnalysisResponse, GeminiFinding } from '../types';
import { ShareIcon } from '../constants';
import { useTranslation } from '../i18n';
import ExportableBubbleChart from './ExportableBubbleChart';
// CORRECTED: Import PDF_TITLE_TEXT from the config file.
import { PDF_CONFIG, PDF_TITLE_TEXT } from '../pdf-config';

// Define the interfaces for props
interface BubbleData {
  id: string; name: string; strength: number; category: string; color: string; radius: number;
}
interface ShareMenuProps {
  analysis: GeminiAnalysisResponse;
  sourceText: string | null;
  highlightData: any[];
  patternColorMap: Map<string, string>;
  bubbleChartData: BubbleData[];
  rebuttal: string | null;
  includeRebuttalInJson: boolean;
  includeRebuttalInPdf: boolean;
}

const ShareMenu: React.FC<ShareMenuProps> = ({
    analysis,
    sourceText,
    highlightData,
    patternColorMap,
    bubbleChartData,
    rebuttal,
    includeRebuttalInJson,
    includeRebuttalInPdf,
}) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const pdfDataRef = useRef<any>(null);
  const pdfFilenameRef = useRef<string | null>(null);

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
    pdfFilenameRef.current = null;
    setIsGenerating(false);
  };

  const handlePdfDownload = async () => {
    setIsMenuOpen(false);
    setIsGenerating(true);

    const now = new Date();
    const pad = (num: number) => num.toString().padStart(2, '0');
    const reportId = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    pdfFilenameRef.current = `HootSpot_Analysis_Report_${reportId}.pdf`;

    let chartImage: string | null = null;
    const hiddenContainer = document.createElement('div');
    hiddenContainer.style.position = 'absolute';
    hiddenContainer.style.left = '-9999px';
    hiddenContainer.style.width = '600px';
    hiddenContainer.style.height = '450px';
    hiddenContainer.style.backgroundColor = PDF_CONFIG.CHART_BACKGROUND_COLOR;
    document.body.appendChild(hiddenContainer);

    const root = createRoot(hiddenContainer);
    root.render(
      <ExportableBubbleChart
        data={bubbleChartData}
        width={600}
        height={450}
      />
    );

    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      const canvas = await html2canvas(hiddenContainer, {
        scale: PDF_CONFIG.CHART_IMAGE_SCALE,
        backgroundColor: null
      });
      chartImage = canvas.toDataURL('image/png');
    } catch (error) {
      console.error("Failed to capture chart image:", error);
    } finally {
      root.unmount();
      document.body.removeChild(hiddenContainer);
    }

    pdfDataRef.current = {
      analysis,
      sourceText,
      highlightData,
      chartImage,
      patternColorMap: Object.fromEntries(patternColorMap.entries()),
      rebuttal: includeRebuttalInPdf ? rebuttal : null,
      translations: {
        // CORRECTED: Use the imported constant from the config file.
        reportTitle: PDF_TITLE_TEXT,
        summaryTitle: t('report_summary_title'),
        highlightedTextTitle: t('report_highlighted_text_title'),
        profileTitle: t('report_profile_title'),
        detectedPatternsTitle: t('report_detected_patterns_title'),
        rebuttalTitle: t('rebuttal_title_pdf'),
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
    const now = new Date();
    const pad = (num: number) => num.toString().padStart(2, '0');
    const reportId = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filename = `HootSpot_Analysis_Report_${reportId}.json`;

    const dataToSave: any = {
      reportId: reportId,
      sourceText: sourceText,
      analysisResult: analysis
    };

    if (includeRebuttalInJson && rebuttal) {
      dataToSave.rebuttal = rebuttal;
    }

    const jsonString = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({ url: url, filename: filename });
    setTimeout(() => URL.revokeObjectURL(url), 100);
    setIsMenuOpen(false);
  };

  return (
    <div className="relative share-menu-container ml-3" ref={menuRef}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        disabled={isGenerating}
        className="p-2 rounded-full disabled:opacity-50 disabled:cursor-wait
                   bg-gray-100 text-gray-600
                   dark:bg-input-bg-dark dark:text-text-subtle-dark
                   hover:text-link-light dark:hover:text-link-dark
                   transition-colors duration-150"
        title={t('share_menu_tooltip')}
      >
        {isGenerating
          ? <div className="spinner w-5 h-5 border-t-link-light"></div>
          : <ShareIcon className="w-5 h-5 pr-[3px]" />
        }
      </button>

      {isMenuOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-panel-bg-light dark:bg-panel-bg-dark rounded-md shadow-lg z-20 border border-panel-border-light dark:border-panel-border-dark">
          <ul className="py-1">
            <li>
              <button
                onClick={handlePdfDownload}
                className="w-full text-left px-4 py-2 text-sm text-text-main-light dark:text-text-main-dark hover:bg-container-bg-light dark:hover:bg-container-bg-dark">
                  {t('share_menu_pdf')}
              </button>
            </li>
            <li>
              <button
                onClick={handleJsonDownload}
                className="w-full text-left px-4 py-2 text-sm text-text-main-light dark:text-text-main-dark hover:bg-container-bg-light dark:hover:bg-container-bg-dark">
                  {t('share_menu_json')}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ShareMenu;