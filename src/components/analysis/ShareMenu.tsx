// src/components/analysis/ShareMenu.tsx
import React, { useState, useRef, useEffect } from 'react';
import { GeminiAnalysisResponse } from '../../types/api';
import { ShareIcon } from '../../assets/icons';
import { useTranslation } from '../../i18n';
import { usePdfGenerator } from '../../hooks/usePdfGenerator';

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
  const menuRef = useRef<HTMLDivElement>(null);
  const { isGenerating, generatePdf } = usePdfGenerator();

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
    setIsMenuOpen(false);
    generatePdf(
      analysis,
      sourceText,
      highlightData,
      patternColorMap,
      bubbleChartData,
      rebuttal,
      includeRebuttalInPdf
    );
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