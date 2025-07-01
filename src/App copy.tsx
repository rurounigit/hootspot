// src/App.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ApiKeyManager from './components/ApiKeyManager';
import TextAnalyzer from './components/TextAnalyzer';
import AnalysisReport from './components/AnalysisReport';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useTranslation } from './i18n';
import { analyzeText } from './services/geminiService';
import { GeminiAnalysisResponse } from './types';
import {
  API_KEY_STORAGE_KEY,
  MAX_CHAR_LIMIT_STORAGE_KEY,
  DEFAULT_MAX_CHAR_LIMIT,
  HootSpotLogoIcon
} from './constants';

const App: React.FC = () => {
  const { t, language } = useTranslation();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [maxCharLimit, setMaxCharLimit] = useState<number>(DEFAULT_MAX_CHAR_LIMIT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResponse | null>(null);
  const [currentTextAnalyzed, setCurrentTextAnalyzed] = useState<string | null>(null);
  const [isKeyValid, setIsKeyValid] = useState<boolean>(false);
  const [textToAnalyze, setTextToAnalyze] = useState('');

  const analysisReportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // --- Load settings from local storage ---
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsKeyValid(true);
    }
    const storedMaxCharLimit = localStorage.getItem(MAX_CHAR_LIMIT_STORAGE_KEY);
    if (storedMaxCharLimit) {
      setMaxCharLimit(parseInt(storedMaxCharLimit, 10) || DEFAULT_MAX_CHAR_LIMIT);
    }

    // --- SETUP PUSH LISTENER ---
    // This handles new text selections when the panel is *already open*.
    const pushListener = (request: any) => {
      if (request.type === 'PUSH_TEXT_TO_PANEL' && request.text) {
        setTextToAnalyze(request.text);
      }
    };
    chrome.runtime.onMessage.addListener(pushListener);

    // --- EXECUTE PULL MECHANISM ---
    // This runs once on mount to get text selected *before* the panel opened.
    chrome.runtime.sendMessage({ type: 'PULL_INITIAL_TEXT' }, (response) => {
      if (chrome.runtime.lastError) {
        // This is safe to ignore.
        return;
      }
      if (response && response.text) {
        setTextToAnalyze(response.text);
      }
    });

    // --- Cleanup function ---
    return () => {
      chrome.runtime.onMessage.removeListener(pushListener);
    };
  }, []);

  useEffect(() => {
    if (analysisResult && analysisReportRef.current) {
      analysisReportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [analysisResult]);

  const handleApiKeySave = useCallback(async (newApiKey: string) => {
    try {
      localStorage.setItem(API_KEY_STORAGE_KEY, newApiKey);
      setApiKey(newApiKey);
      setIsKeyValid(true);
      setError(null);
      return {success: true};
    } catch (e) {
      console.error("Error saving API key to localStorage:", e);
      return {success: false, error: t('error_save_api_key_storage')};
    }
  }, [t]);

  const handleMaxCharLimitSave = useCallback((newLimit: number) => {
    localStorage.setItem(MAX_CHAR_LIMIT_STORAGE_KEY, newLimit.toString());
    setMaxCharLimit(newLimit);
  }, []);

  const handleAnalyzeText = async (text: string) => {
    if (!apiKey) {
      setError(t('error_api_key_not_configured'));
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setCurrentTextAnalyzed(text);

    try {
      const result = await analyzeText(apiKey, text, t, language);
      console.log('--- RAW API RESPONSE (from App.tsx) ---', JSON.stringify(result, null, 2));
      setAnalysisResult(result);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred during analysis.");
      setAnalysisResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-screen bg-gradient-to-br from-athena-logo-bg to-athena-logo-bg">
      <LanguageSwitcher />
      <div className="flex flex-col flex-1 w-full p-2 md:p-4 overflow-y-auto">
        <header className="mb-1 text-left">
          <div className="inline-flex items-center justify-center">
             <HootSpotLogoIcon className="w-9 h-9 md:w-13 md:h-13 text-blue-600 mr-2 md:mr-3 ml-2.5" />
            <div>
                <h1 className="text-lg md:text-3xl font-semibold text-gray-800">{t('app_title')}</h1>
                <p className="text-md md:text-lg text-gray-600"></p>
            </div>
          </div>
        </header>

        <main className="flex-grow">
          <ApiKeyManager
            currentApiKey={apiKey}
            onApiKeySave={handleApiKeySave}
            currentMaxCharLimit={maxCharLimit}
            onMaxCharLimitSave={handleMaxCharLimitSave}
          />

          <TextAnalyzer
            text={textToAnalyze}
            onTextChange={setTextToAnalyze}
            onAnalyze={handleAnalyzeText}
            isLoading={isLoading}
            maxCharLimit={maxCharLimit}
            hasApiKey={!!apiKey && isKeyValid}
          />

          {error && (
            <div className="my-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md shadow-md" role="alert">
              <strong className="font-bold">{t('error_prefix')}</strong>
              <span>{error}</span>
            </div>
          )}

          <div ref={analysisReportRef} className="mt-2">
            {(!isLoading && !error && analysisResult) && (
               <AnalysisReport analysis={analysisResult} sourceText={currentTextAnalyzed} />
            )}
          </div>

          {(!isLoading && !error && !analysisResult && currentTextAnalyzed && !apiKey) && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md shadow-md">
                {t('error_no_api_key_for_results')}
            </div>
          )}

          {(!isLoading && !error && !analysisResult && !currentTextAnalyzed && apiKey) && (
            <div className="mt-4 p-6 bg-white border border-gray-200 text-gray-600 rounded-lg shadow-md text-center">
                <p className="text-lg">{t('info_enter_text_to_analyze')}</p>
                <p className="text-sm mt-2">{t('info_uncover_patterns')}</p>
            </div>
          )}
        </main>
        <footer className="mt-auto pt-6 text-center text-sm text-gray-500">
          <p>{t('app_footer_copyright', { year: new Date().getFullYear() })}</p>
          <p>{t('app_footer_responsibility')}</p>
        </footer>
      </div>
    </div>
  );
};

export default App;