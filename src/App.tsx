// src/App.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ApiKeyManager from './components/ApiKeyManager';
import TextAnalyzer from './components/TextAnalyzer';
import AnalysisReport from './components/AnalysisReport';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useTranslation } from './i18n';
import { analyzeText, translateAnalysisResult, translateText } from './services/geminiService';
import { useModels } from './hooks/useModels';
import { GeminiAnalysisResponse } from './types';
import {
  API_KEY_STORAGE_KEY,
  MAX_CHAR_LIMIT_STORAGE_KEY,
  DEFAULT_MAX_CHAR_LIMIT,
  HootSpotLogoIcon,
  SELECTED_MODEL_STORAGE_KEY,
  GEMINI_MODEL_NAME,
  SunIcon,
  MoonIcon,
  INCLUDE_REBUTTAL_JSON_KEY,
  INCLUDE_REBUTTAL_PDF_KEY,
} from './constants';

const NIGHT_MODE_STORAGE_KEY = 'hootspot-night-mode';

const App: React.FC = () => {
  const { t, language } = useTranslation();

  // State for the saved/validated API key and the live input value
  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem(API_KEY_STORAGE_KEY));
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => localStorage.getItem(API_KEY_STORAGE_KEY) || '');
  const [debouncedApiKey, setDebouncedApiKey] = useState<string | null>(apiKey);

  // Debounce the API key input from the user to avoid excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedApiKey(apiKeyInput.trim());
    }, 500); // 500ms delay
    return () => clearTimeout(handler);
  }, [apiKeyInput]);

  // useModels is now driven by the debounced key
  const { models, isLoading: areModelsLoading, error: modelsError } = useModels(debouncedApiKey);

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem(SELECTED_MODEL_STORAGE_KEY) || GEMINI_MODEL_NAME;
  });

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
  const [isNightMode, setIsNightMode] = useState<boolean>(() => localStorage.getItem(NIGHT_MODE_STORAGE_KEY) === 'true');

  const [rebuttal, setRebuttal] = useState<{ text: string; lang: string; } | null>(null);
  const [translatedRebuttals, setTranslatedRebuttals] = useState<Record<string, string>>({});
  const [isTranslatingRebuttal, setIsTranslatingRebuttal] = useState(false);
  const [includeRebuttalInJson, setIncludeRebuttalInJson] = useState<boolean>(() => localStorage.getItem(INCLUDE_REBUTTAL_JSON_KEY) === 'true');
  const [includeRebuttalInPdf, setIncludeRebuttalInPdf] = useState<boolean>(() => localStorage.getItem(INCLUDE_REBUTTAL_PDF_KEY) === 'true');

  const textWasSetProgrammatically = useRef(false);
  const lastAction = useRef<'PUSH' | 'APPEND'>('PUSH');
  const analysisReportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This effect now only handles initial setup that doesn't depend on the API key directly
    const storedMaxCharLimit = localStorage.getItem(MAX_CHAR_LIMIT_STORAGE_KEY);
    if (storedMaxCharLimit) { setMaxCharLimit(parseInt(storedMaxCharLimit, 10) || DEFAULT_MAX_CHAR_LIMIT); }
    if (apiKey) { setIsKeyValid(true); }

    const messageListener = (request: any) => {
      textWasSetProgrammatically.current = true;
      if (request.type === 'PUSH_TEXT_TO_PANEL' && request.text) {
        lastAction.current = 'PUSH';
        setTextToAnalyze(request.text);
        if (request.autoAnalyze) { setPendingAnalysis({ text: request.text }); }
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
        if (response.autoAnalyze) { setPendingAnalysis({ text: response.text }); }
      }
    });
    return () => { chrome.runtime.onMessage.removeListener(messageListener); };
  }, [apiKey]); // Keep apiKey dependency here to re-evaluate isKeyValid if it changes

  // This effect handles saving the selected model and validating it against the fetched list
  useEffect(() => {
    localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, selectedModel);

    const allModels = [...models.preview, ...models.stable];
    if (allModels.length === 0) return;

    const isSelectedModelAvailable = allModels.some(m => m.name === selectedModel);

    // If the currently selected model is NOT in the new list, reset to the default.
    if (!isSelectedModelAvailable) {
      setSelectedModel(GEMINI_MODEL_NAME);
    }
  }, [selectedModel, models]);

  useEffect(() => {
    if (!areModelsLoading && modelsError) {
      console.warn(`Model fetch failed: ${modelsError}. Falling back to default: ${GEMINI_MODEL_NAME}`);
      setSelectedModel(GEMINI_MODEL_NAME);
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

  useEffect(() => {
    localStorage.setItem(INCLUDE_REBUTTAL_JSON_KEY, String(includeRebuttalInJson));
  }, [includeRebuttalInJson]);

  useEffect(() => {
    localStorage.setItem(INCLUDE_REBUTTAL_PDF_KEY, String(includeRebuttalInPdf));
  }, [includeRebuttalInPdf]);

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
    setRebuttal(null);
    setTranslatedRebuttals({});

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
    if(apiKey) {
        translateAnalysisResult(apiKey, analysisResult, language, selectedModel, t)
        .then(translated => {
            setTranslatedResults(prev => ({ ...prev, [language]: translated }));
        })
        .catch(err => setError(err.message))
        .finally(() => setIsTranslating(false));
    }
  }, [language, analysisResult, translatedResults, apiKey, selectedModel, t]);

  useEffect(() => {
    if (!rebuttal || !apiKey) return;
    if (language === rebuttal.lang) return;
    if (translatedRebuttals[language]) return;

    setIsTranslatingRebuttal(true);
    setError(null);
    translateText(apiKey, rebuttal.text, language, selectedModel, t)
      .then(translated => {
        setTranslatedRebuttals(prev => ({ ...prev, [language]: translated }));
      })
      .catch(err => setError(err.message))
      .finally(() => setIsTranslatingRebuttal(false));
  }, [language, rebuttal, translatedRebuttals, apiKey, selectedModel, t]);

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
          if (data.rebuttal && typeof data.rebuttal === 'string') {
            const initialRebuttal = { text: data.rebuttal, lang: 'en' };
            setRebuttal(initialRebuttal);
            setTranslatedRebuttals({ en: data.rebuttal });
          } else {
            setRebuttal(null);
            setTranslatedRebuttals({});
          }
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

  const handleRebuttalUpdate = (newRebuttal: string) => {
    const canonicalRebuttal = { text: newRebuttal, lang: language };
    setRebuttal(canonicalRebuttal);
    setTranslatedRebuttals({ [language]: newRebuttal });
  };

  const displayedAnalysis = translatedResults[language] || analysisResult;
  const displayedRebuttal = translatedRebuttals[language] || null;

  return (
    <div className="relative flex flex-col h-screen bg-app-bg-light dark:bg-app-bg-dark">
      <div className="absolute top-2 right-4 z-10 flex items-center space-x-2">
        <button
          onClick={() => setIsNightMode(!isNightMode)}
          className="p-1.5 text-text-subtle-light dark:text-text-subtle-dark hover:bg-container-border-light dark:hover:bg-container-border-dark rounded-full focus:outline-none"
          title={t('night_mode_toggle_tooltip')}
        >
          {isNightMode ? (
            <SunIcon className="w-5 h-5 text-sun-icon-light" />
          ) : (
            <MoonIcon className="w-5 h-5 text-moon-icon-light" />
          )}
        </button>
        <LanguageSwitcher />
      </div>
      <div className="flex flex-col flex-1 w-full p-2 md:p-4 overflow-y-auto text-text-main-light dark:text-text-main-dark">
        <header className="mb-1 text-left">
          <div className="inline-flex items-center justify-center">
             <HootSpotLogoIcon className="w-9 h-9 md:w-13 md:h-13 text-logo-icon-light dark:text-logo-icon-dark mr-2 md:mr-3 ml-2.5" />
            <div>
                <h1 className="text-lg md:text-3xl font-semibold text-text-main-light dark:text-text-main-dark">{t('app_title')}</h1>
                <p className="text-md md:text-lg text-text-subtle-light dark:text-text-subtle-dark"></p>
            </div>
          </div>
        </header>

        <main className="flex-grow">
          <ApiKeyManager
            apiKeyInput={apiKeyInput}
            onApiKeyInputChange={setApiKeyInput}
            onApiKeySave={handleApiKeySave}
            currentMaxCharLimit={maxCharLimit}
            onMaxCharLimitSave={handleMaxCharLimitSave}
            models={models}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            areModelsLoading={areModelsLoading}
            modelsError={modelsError}
            isNightMode={isNightMode}
            onNightModeChange={setIsNightMode}
            includeRebuttalInJson={includeRebuttalInJson}
            onIncludeRebuttalInJsonChange={setIncludeRebuttalInJson}
            includeRebuttalInPdf={includeRebuttalInPdf}
            onIncludeRebuttalInPdfChange={setIncludeRebuttalInPdf}
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
            <div className="my-4 p-3 rounded-md text-sm bg-info-bg-light text-info-text-light border border-info-border-light dark:bg-info-bg-dark dark:text-info-text-dark dark:border-info-border-dark flex items-center justify-center">
              <div className="spinner w-5 h-5 border-t-link-light mr-2"></div>
              {isLoading ? t('analyzer_button_analyzing') : t('info_translating_results')}
            </div>
          )}
          {isTranslatingRebuttal && (
            <div className="my-4 p-3 rounded-md text-sm bg-info-bg-light text-info-text-light border border-info-border-light dark:bg-info-bg-dark dark:text-info-text-dark dark:border-info-border-dark flex items-center justify-center">
              <div className="spinner w-5 h-5 border-t-link-light mr-2"></div>
              {t('info_translating_rebuttal')}
            </div>
          )}
          {error && (
            <div className="my-6 p-4 bg-error-bg-light border border-error-border-light text-error-text-light dark:bg-error-bg-dark dark:text-error-text-dark dark:border-error-border-dark rounded-md shadow-md" role="alert">
              <strong className="font-bold">{t('error_prefix')}</strong>
              <span>{error}</span>
            </div>
          )}
          <div ref={analysisReportRef} className="mt-2">
            {(!isLoading && !isTranslating && !error && displayedAnalysis) && (
               <AnalysisReport
                    analysis={displayedAnalysis}
                    sourceText={currentTextAnalyzed}
                    apiKey={apiKey}
                    selectedModel={selectedModel}
                    rebuttal={displayedRebuttal}
                    isTranslatingRebuttal={isTranslatingRebuttal}
                    onRebuttalUpdate={handleRebuttalUpdate}
                    includeRebuttalInJson={includeRebuttalInJson}
                    includeRebuttalInPdf={includeRebuttalInPdf}
               />
            )}
          </div>
          {(!isLoading && !error && !analysisResult && currentTextAnalyzed && !apiKey) && (
            <div className="mt-4 p-4 bg-warning-bg-light border border-warning-border-light text-warning-text-light dark:bg-warning-bg-dark dark:text-warning-text-dark dark:border-warning-border-dark rounded-md shadow-md">
                {t('error_no_api_key_for_results')}
            </div>
          )}
          {(!isLoading && !error && !analysisResult && !currentTextAnalyzed && apiKey) && (
            <div className="mt-4 p-6 bg-panel-bg-light border border-panel-border-light text-text-subtle-light dark:bg-panel-bg-dark dark:border-panel-border-dark dark:text-text-subtle-dark rounded-lg shadow-md text-center">
                <p className="text-lg">{t('info_enter_text_to_analyze')}</p>
                <p className="text-sm mt-2">{t('info_uncover_patterns')}</p>
            </div>
          )}
        </main>
        <footer className="mt-auto pt-6 text-center text-sm text-text-subtle-light dark:text-text-subtle-dark">
          <p>{t('app_footer_copyright', { year: new Date().getFullYear() })}</p>
          <p>{t('app_footer_responsibility')}</p>
        </footer>
      </div>
    </div>
  );
};

export default App;