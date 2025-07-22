// src/hooks/usePdfGenerator.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { useTranslation } from '../i18n';
import ExportableBubbleChart from '../components/pdf/ExportableBubbleChart';
import { PDF_CHART_CONFIG, PDF_TITLE_TEXT } from '../config/chart';
import { GeminiAnalysisResponse } from '../types/api';

interface BubbleData {
  id: string; name: string; strength: number; category: string; color: string; radius: number;
}

export const usePdfGenerator = () => {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const pdfDataRef = useRef<any>(null);
  const pdfFilenameRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (iframeRef.current) {
      document.body.removeChild(iframeRef.current);
      iframeRef.current = null;
    }
    pdfDataRef.current = null;
    pdfFilenameRef.current = null;
    setIsGenerating(false);
  }, []);

  useEffect(() => {
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

    return () => {
      window.removeEventListener('message', handlePdfMessage);
      cleanup();
    };
  }, [cleanup]);

  const generatePdf = useCallback(async (
    analysis: GeminiAnalysisResponse,
    sourceText: string | null,
    highlightData: any[],
    patternColorMap: Map<string, string>,
    bubbleChartData: BubbleData[],
    rebuttal: string | null,
    includeRebuttalInPdf: boolean
  ) => {
    if (isGenerating) return;
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
    hiddenContainer.style.backgroundColor = PDF_CHART_CONFIG.CHART_BACKGROUND_COLOR;
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
        scale: PDF_CHART_CONFIG.CHART_IMAGE_SCALE,
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

  }, [isGenerating, t, cleanup]);

  return { isGenerating, generatePdf };
};