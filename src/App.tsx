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
  GEMINI_MODEL_NAME
} from './constants';

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

  // analysisResult is now ALWAYS the English source of truth
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResponse | null>(null);
  const [currentTextAnalyzed, setCurrentTextAnalyzed] = useState<string | null>(null);
  const [isKeyValid, setIsKeyValid] = useState<boolean>(false);
  const [textToAnalyze, setTextToAnalyze] = useState('');
  const [pendingAnalysis, setPendingAnalysis] = useState<{ text: string } | null>(null);

  const [translatedResults, setTranslatedResults] = useState<Record<string, GeminiAnalysisResponse>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textWasSetProgrammatically = useRef(false);
  const analysisReportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // --- Load settings from local storage ---
    const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedApiKey) { setApiKey(storedApiKey); setIsKeyValid(true); }
    const storedMaxCharLimit = localStorage.getItem(MAX_CHAR_LIMIT_STORAGE_KEY);
    if (storedMaxCharLimit) { setMaxCharLimit(parseInt(storedMaxCharLimit, 10) || DEFAULT_MAX_CHAR_LIMIT); }

    // --- SETUP MESSAGE LISTENER ---
    const messageListener = (request: any) => {
      if (request.type === 'PUSH_TEXT_TO_PANEL' && request.text) {
        textWasSetProgrammatically.current = true;
        setTextToAnalyze(request.text);
        if (request.autoAnalyze) {
          setPendingAnalysis({ text: request.text });
        }
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);

    // --- EXECUTE PULL MECHANISM ---
    chrome.runtime.sendMessage({ type: 'PULL_INITIAL_TEXT' }, (response) => {
      if (chrome.runtime.lastError) { return; }
      if (response && response.text) {
        textWasSetProgrammatically.current = true;
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

  // Handles the successful loading of the model list
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

  // Handles model fetching errors by falling back to a default
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
      textareaRef.current?.select();
      textWasSetProgrammatically.current = false;
    }
  }, [textToAnalyze]);

  const handleAnalyzeText = useCallback(async (text: string) => {
    if (!apiKey) {
      setError(t('error_api_key_not_configured'));
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setCurrentTextAnalyzed(text);
    setTranslatedResults({}); // Clear all old translations

    try {
      // Step 1: Always get the analysis in English
      const englishResult = await analyzeText(apiKey, text, selectedModel);
      setAnalysisResult(englishResult);

      // Step 2: If the current UI language is not English, translate immediately
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

  // Effect to handle translating results when language is switched AFTER analysis
  useEffect(() => {
    // Exit if there is no base analysis to translate, or if the language is English
    if (!analysisResult || language === 'en') {
      return;
    }

    // Exit if we already have a translation for the current language
    if (translatedResults[language]) {
      return;
    }

    // Automatically translate to the new language
    setIsTranslating(true);
    setError(null);
    translateAnalysisResult(apiKey!, analysisResult, language, selectedModel, t)
      .then(translated => {
        setTranslatedResults(prev => ({ ...prev, [language]: translated }));
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setIsTranslating(false);
      });
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

  // Determine which version of the analysis to display
  const displayedAnalysis = translatedResults[language] || analysisResult;

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
            models={models}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            currentModelDetails={currentModelDetails}
            areModelsLoading={areModelsLoading}
            modelsError={modelsError}
          />

          <TextAnalyzer
            ref={textareaRef}
            text={textToAnalyze}
            onTextChange={setTextToAnalyze}
            onAnalyze={handleAnalyzeText}
            isLoading={isLoading}
            maxCharLimit={maxCharLimit}
            hasApiKey={!!apiKey && isKeyValid}
          />

          {(isLoading || isTranslating) && (
            <div className="my-4 p-3 rounded-md text-sm bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
              <div className="spinner w-5 h-5 border-t-blue-600 mr-2"></div>
              {isLoading ? t('analyzer_button_analyzing') : t('info_translating_results')}
            </div>
          )}

          {error && (
            <div className="my-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md shadow-md" role="alert">
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