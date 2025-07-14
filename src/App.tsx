// src/App.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ApiKeyManager from './components/ApiKeyManager';
import TextAnalyzer from './components/TextAnalyzer';
import AnalysisReport from './components/AnalysisReport';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useTranslation } from './i18n';
import { analyzeText, translateAnalysisResult } from './services/geminiService';
import { useModels } from './hooks/useModels';
import { GeminiAnalysisResponse, GeminiModel } from './types';
import {
  API_KEY_STORAGE_KEY,
  MAX_CHAR_LIMIT_STORAGE_KEY,
  DEFAULT_MAX_CHAR_LIMIT,
  HootSpotLogoIcon,
  SELECTED_MODEL_STORAGE_KEY,
  GEMINI_MODEL_NAME,
  SunIcon,
  MoonIcon,
} from './constants';

const NIGHT_MODE_STORAGE_KEY = 'hootspot-night-mode';

const App: React.FC = () => {
  const { t, language } = useTranslation();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const { models, isLoading: areModelsLoading, error: modelsError } = useModels(apiKey);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem(SELECTED_MODEL_STORAGE_KEY) || GEMINI_MODEL_NAME;
  });
  const [currentModelDetails, setCurrentModelDetails] = useState<GeminiModel | null>(null);
  const [maxCharLimit, setMaxCharLimit] = useState<number>(DEFAULT_MAX_CHAR_LIMIT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResponse | null>(null);
  const [currentTextAnalyzed, setCurrentTextAnalyzed] = useState<string | null>(null);
  const [isKeyValid, setIsKeyValid] = useState<boolean>(false);
  const [textToAnalyze, setTextToAnalyze] = useState('');
  const [pendingAnalysis, setPendingAnalysis] = useState<{ text: string } | null>(null);

  const [translatedResults, setTranslatedResults] = useState<Record<string, GeminiAnalysisResponse>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isNightMode, setIsNightMode] = useState<boolean>(() => {
    const storedValue = localStorage.getItem(NIGHT_MODE_STORAGE_KEY);
    return storedValue === 'true';
  });
  const textWasSetProgrammatically = useRef(false);
  const lastAction = useRef<'PUSH' | 'APPEND'>('PUSH');
  const analysisReportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedApiKey) { setApiKey(storedApiKey); setIsKeyValid(true); }
    const storedMaxCharLimit = localStorage.getItem(MAX_CHAR_LIMIT_STORAGE_KEY);
    if (storedMaxCharLimit) { setMaxCharLimit(parseInt(storedMaxCharLimit, 10) || DEFAULT_MAX_CHAR_LIMIT); }

    const messageListener = (request: any) => {
      textWasSetProgrammatically.current = true;
      if (request.type === 'PUSH_TEXT_TO_PANEL' && request.text) {
        lastAction.current = 'PUSH';
        setTextToAnalyze(request.text);
        if (request.autoAnalyze) {
          setPendingAnalysis({ text: request.text });
        }
      } else if (request.type === 'APPEND_TEXT_TO_PANEL' && request.text) {
        lastAction.current = 'APPEND';
        setTextToAnalyze(prevText => {
            const separator = prevText.trim() ? '\n\n' : '';
            return prevText + separator + request.text;
        });
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);

    chrome.runtime.sendMessage({ type: 'PULL_INITIAL_TEXT' }, (response) => {
      if (chrome.runtime.lastError) { return; }
      if (response && response.text) {
        textWasSetProgrammatically.current = true;
        lastAction.current = 'PUSH';
        setTextToAnalyze(response.text);
        if (response.autoAnalyze) {
          setPendingAnalysis({ text: response.text });
        }
      }
    });

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  useEffect(() => {
    const allModels = [...models.preview, ...models.stable];
    if (allModels.length === 0) return;
    localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, selectedModel);
    const details = allModels.find(m => m.name === selectedModel) || null;
    setCurrentModelDetails(details);
    if (!details) {
      const defaultModel = allModels.find(m => m.name === GEMINI_MODEL_NAME) || allModels[0];
      if (defaultModel) {
        setSelectedModel(defaultModel.name);
      }
    }
  }, [selectedModel, models]);

  useEffect(() => {
    if (!areModelsLoading && modelsError) {
      console.warn(`Model fetch failed: ${modelsError}. Falling back to default: ${GEMINI_MODEL_NAME}`);
      setSelectedModel(GEMINI_MODEL_NAME);
      setCurrentModelDetails({
        name: 'models/gemini-2.5-flash-lite-preview-06-17',
        displayName: 'Gemini 2.5 Flash-Lite Preview 06-17',
        supportedGenerationMethods: ['generateContent'],
        version: '2.5-preview-06-17',
      });
    }
  }, [areModelsLoading, modelsError]);

  useEffect(() => {
    if (textWasSetProgrammatically.current) {
      textareaRef.current?.focus();
      if (lastAction.current === 'APPEND') {
        const end = textareaRef.current?.value.length || 0;
        textareaRef.current?.setSelectionRange(end, end);
      } else {
        textareaRef.current?.select();
      }
      textWasSetProgrammatically.current = false;
    }
  }, [textToAnalyze]);

  useEffect(() => {
    localStorage.setItem(NIGHT_MODE_STORAGE_KEY, String(isNightMode));
    if (isNightMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isNightMode]);

  const handleAnalyzeText = useCallback(async (text: string) => {
    if (!apiKey) {
      setError(t('error_api_key_not_configured'));
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setCurrentTextAnalyzed(text);
    setTranslatedResults({});

    try {
      const englishResult = await analyzeText(apiKey, text, selectedModel);
      setAnalysisResult(englishResult);
      if (language !== 'en' && englishResult.findings.length > 0) {
        setIsTranslating(true);
        const translatedResult = await translateAnalysisResult(apiKey, englishResult, language, selectedModel, t);
        setTranslatedResults({ [language]: translatedResult });
        setIsTranslating(false);
      }
    } catch (err: any) {
      setError(err.message || "An unknown error occurred during analysis.");
      setAnalysisResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, selectedModel, language, t]);

  useEffect(() => {
    if (!analysisResult || language === 'en') return;
    if (translatedResults[language]) return;
    setIsTranslating(true);
    setError(null);
    translateAnalysisResult(apiKey!, analysisResult, language, selectedModel, t)
      .then(translated => {
        setTranslatedResults(prev => ({ ...prev, [language]: translated }));
      })
      .catch(err => setError(err.message))
      .finally(() => setIsTranslating(false));
  }, [language, analysisResult, translatedResults, apiKey, selectedModel, t]);

  useEffect(() => {
    if (pendingAnalysis && apiKey) {
      handleAnalyzeText(pendingAnalysis.text);
      setPendingAnalysis(null);
    }
  }, [pendingAnalysis, apiKey, handleAnalyzeText]);

  useEffect(() => {
    if (analysisResult && analysisReportRef.current) {
      analysisReportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [analysisResult]);

  const handleJsonLoad = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        if (data.reportId && data.analysisResult && typeof data.sourceText === 'string') {
          setAnalysisResult(data.analysisResult);
          setCurrentTextAnalyzed(data.sourceText);
          setTextToAnalyze(data.sourceText);
          setTranslatedResults({});
          setError(null);
        } else {
          throw new Error(t('error_invalid_json_file'));
        }
      } catch (e: any) {
        setError(`${t('error_json_load_failed')} ${e.message}`);
      }
    };
    reader.readAsText(file);
  };

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

  const displayedAnalysis = translatedResults[language] || analysisResult;

  return (
    <div className="relative flex flex-col h-screen bg-gradient-to-br from-athena-logo-bg to-athena-logo-bg dark:from-gray-600 dark:to-gray-500">
      <div className="absolute top-2 right-4 z-10 flex items-center space-x-2">
        <button
          onClick={() => setIsNightMode(!isNightMode)}
          className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full focus:outline-none"
          title={t('night_mode_toggle_tooltip')}
        >
          {isNightMode ? (
            <SunIcon className="w-5 h-5 text-yellow-400" />
          ) : (
            <MoonIcon className="w-5 h-5 text-gray-600" />
          )}
        </button>
        <LanguageSwitcher />
      </div>
      <div className="flex flex-col flex-1 w-full p-2 md:p-4 overflow-y-auto text-gray-800 dark:text-gray-200">
        <header className="mb-1 text-left">
          <div className="inline-flex items-center justify-center">
             <HootSpotLogoIcon className="w-9 h-9 md:w-13 md:h-13 text-blue-600 mr-2 md:mr-3 ml-2.5" />
            <div>
                <h1 className="text-lg md:text-3xl font-semibold text-gray-800 dark:text-gray-100">{t('app_title')}</h1>
                <p className="text-md md:text-lg text-gray-600 dark:text-gray-400"></p>
            </div>
          </div>
        </header>

        <main className="flex-grow">
          <ApiKeyManager
            currentApiKey={apiKey}
            onApiKeySave={handleApiKeySave}
            currentMaxCharLimit={maxCharLimit}
            onMaxCharLimitSave={handleMaxCharLimitSave}
            models={models}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            currentModelDetails={currentModelDetails}
            areModelsLoading={areModelsLoading}
            modelsError={modelsError}
            isNightMode={isNightMode}
            onNightModeChange={setIsNightMode}
          />
          <TextAnalyzer
            ref={textareaRef}
            text={textToAnalyze}
            onTextChange={setTextToAnalyze}
            onAnalyze={handleAnalyzeText}
            isLoading={isLoading}
            maxCharLimit={maxCharLimit}
            onJsonLoad={handleJsonLoad}
            hasApiKey={!!apiKey && isKeyValid}
          />
          {(isLoading || isTranslating) && (
            <div className="my-4 p-3 rounded-md text-sm bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700 flex items-center justify-center">
              <div className="spinner w-5 h-5 border-t-blue-600 mr-2"></div>
              {isLoading ? t('analyzer_button_analyzing') : t('info_translating_results')}
            </div>
          )}
          {error && (
            <div className="my-6 p-4 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/50 dark:text-red-200 dark:border-red-700 rounded-md shadow-md" role="alert">
              <strong className="font-bold">{t('error_prefix')}</strong>
              <span>{error}</span>
            </div>
          )}
          <div ref={analysisReportRef} className="mt-2">
            {(!isLoading && !isTranslating && !error && displayedAnalysis) && (
               <AnalysisReport analysis={displayedAnalysis} sourceText={currentTextAnalyzed} />
            )}
          </div>
          {(!isLoading && !error && !analysisResult && currentTextAnalyzed && !apiKey) && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200 dark:border-yellow-700 rounded-md shadow-md">
                {t('error_no_api_key_for_results')}
            </div>
          )}
          {(!isLoading && !error && !analysisResult && !currentTextAnalyzed && apiKey) && (
            <div className="mt-4 p-6 bg-white border border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 rounded-lg shadow-md text-center">
                <p className="text-lg">{t('info_enter_text_to_analyze')}</p>
                <p className="text-sm mt-2">{t('info_uncover_patterns')}</p>
            </div>
          )}
        </main>
        <footer className="mt-auto pt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>{t('app_footer_copyright', { year: new Date().getFullYear() })}</p>
          <p>{t('app_footer_responsibility')}</p>
        </footer>
      </div>
    </div>
  );
};

export default App;