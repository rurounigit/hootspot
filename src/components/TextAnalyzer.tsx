// src/components/TextAnalyzer.tsx
import React, { forwardRef, useRef } from 'react'; // Import forwardRef and useRef
import { AnalyzeIcon } from '../constants';
import { useTranslation } from '../i18n';

interface TextAnalyzerProps {
  text: string;
  onTextChange: (text: string) => void;
  onAnalyze: (text: string) => void;
  onJsonLoad: (file: File) => void; // New prop for the JSON load handler
  isLoading: boolean;
  maxCharLimit: number;
  hasApiKey: boolean;
}

// Wrap the component with forwardRef to allow the parent to get a ref to the textarea
const TextAnalyzer = forwardRef<HTMLTextAreaElement, TextAnalyzerProps>(
  ({ text, onTextChange, onAnalyze, onJsonLoad, isLoading, maxCharLimit, hasApiKey }, ref) => {
    const { t } = useTranslation();
    const charCount = text.length;
    const exceedsLimit = charCount > maxCharLimit;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
      fileInputRef.current?.click();
    };

    const handleAnalyze = () => {
      if (!exceedsLimit && hasApiKey && text.trim().length > 0) {
        onAnalyze(text);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (!isLoading && !exceedsLimit) {
          handleAnalyze();
        }
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onJsonLoad(file);
        // Reset the input so the same file can be loaded again if needed
        e.target.value = '';
      }
    };

    return (
      <div className="bg-white shadow-md  border border-gray-200 rounded-lg p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-1">{t('analyzer_title')}</h2>
        <p className="text-sm text-gray-500 mb-4">{t('analyzer_instruction')}</p>

        {!hasApiKey && (
          <div className="mb-4 p-3 rounded-md text-sm bg-yellow-50 text-yellow-700 border border-yellow-200">
            {t('analyzer_no_api_key_warning')}
          </div>
        )}

        <textarea
          ref={ref} // Attach the forwarded ref here
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('analyzer_placeholder')}
          rows={8}
          className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
          maxLength={maxCharLimit + 500}
          disabled={!hasApiKey || isLoading}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/json"
          style={{ display: 'none' }}
          disabled={isLoading}
        />
        <div className="flex justify-between items-center mt-2 text-sm">
          <p className={`
            ${exceedsLimit ? 'text-red-600 font-semibold' : 'text-gray-600'}
            ${charCount > maxCharLimit * 0.9 ? 'font-medium' : ''}
          `}>
            {t('analyzer_chars_count', { count: charCount, limit: maxCharLimit })}
            {exceedsLimit && t('analyzer_chars_over_limit', { over: charCount - maxCharLimit })}
          </p>
          <div className="flex items-center space-x-2">
            <button onClick={handleUploadClick} disabled={isLoading} className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:bg-gray-400">
              {t('analyzer_button_load_json')}
            </button>
            <button
            onClick={handleAnalyze}
            disabled={isLoading || exceedsLimit || !hasApiKey || text.trim().length === 0}
            className="flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
          >
            {isLoading ? (
              <div className="spinner w-5 h-5 border-t-white mr-2"></div>
            ) : (
              <AnalyzeIcon className="w-5 h-5 mr-2" />
            )}
            {isLoading ? t('analyzer_button_analyzing') : t('analyzer_button_analyze')}
          </button>
          </div>
       </div>
      </div>
    );
  }
);

export default TextAnalyzer;