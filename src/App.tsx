// src/App.tsx

import React, { useEffect, useRef } from 'react';
import ApiKeyManager from './components/ApiKeyManager';
import TextAnalyzer from './components/TextAnalyzer';
import AnalysisReport from './components/analysis/AnalysisReport';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useTranslation } from './i18n';
import { useModels } from './hooks/useModels';
import { useConfig } from './hooks/useConfig';
import { useAnalysis } from './hooks/useAnalysis';
import { useTranslationManager } from './hooks/useTranslationManager';
import { HootSpotLogoIcon, SunIcon, MoonIcon } from './assets/icons';
import { DEFAULT_MAX_CHAR_LIMIT } from './constants';

const App: React.FC = () => {
  const { t, language } = useTranslation();
  const {
    serviceProvider,
    setServiceProvider,
    apiKey,
    apiKeyInput,
    setApiKeyInput,
    debouncedApiKey,
    selectedModel,
    setSelectedModel,
    lmStudioUrl,
    setLmStudioUrl,
    lmStudioModel,
    setLmStudioModel,
    maxCharLimit,
    isNightMode,
    setIsNightMode,
    includeRebuttalInJson,
    setIncludeRebuttalInJson,
    includeRebuttalInPdf,
    setIncludeRebuttalInPdf,
    isConfigCollapsed,
    setIsConfigCollapsed,
    isCurrentProviderConfigured,
    handleMaxCharLimitSave,
  } = useConfig();

  const { models, isLoading: areModelsLoading, error: modelsError } = useModels(serviceProvider === 'google' ? debouncedApiKey : null);

  const {
    isLoading,
    error,
    analysisResult,
    currentTextAnalyzed,
    textToAnalyze,
    setTextToAnalyze,
    setPendingAnalysis,
    isTranslating,
    handleAnalyzeText,
    handleJsonLoad,
    analysisReportRef,
    displayedAnalysis,
  } = useAnalysis(
    serviceProvider,
    apiKey,
    lmStudioUrl,
    lmStudioModel,
    selectedModel,
    isCurrentProviderConfigured,
    setIsConfigCollapsed
  );

  const {
    rebuttal,
    setRebuttal,
    isTranslatingRebuttal,
    handleRebuttalUpdate,
    displayedRebuttal,
    translationError,
  } = useTranslationManager(
    analysisResult,
    apiKey,
    selectedModel,
    serviceProvider
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textWasSetProgrammatically = useRef(false);
  const lastAction = useRef<'PUSH' | 'APPEND'>('PUSH');

  useEffect(() => {
    const messageListener = (request: any) => {
      textWasSetProgrammatically.current = true;
      if (request.type === 'PUSH_TEXT_TO_PANEL' && request.text) {
        lastAction.current = 'PUSH';
        setTextToAnalyze(request.text);
        if (request.autoAnalyze) {
          if (isCurrentProviderConfigured) {
            setPendingAnalysis({ text: request.text });
          } else {
            setIsConfigCollapsed(false);
          }
        }
      } else if (request.type === 'APPEND_TEXT_TO_PANEL' && request.text) {
        lastAction.current = 'APPEND';
        setTextToAnalyze(prevText => `${prevText}${prevText.trim() ? '\n\n' : ''}${request.text}`);
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    chrome.runtime.sendMessage({ type: 'PULL_INITIAL_TEXT' }, (response) => {
      if (chrome.runtime.lastError) { return; }
      if (response?.text) {
        textWasSetProgrammatically.current = true;
        lastAction.current = 'PUSH';
        setTextToAnalyze(response.text);
        if (response.autoAnalyze) {
          if (isCurrentProviderConfigured) {
            setPendingAnalysis({ text: response.text });
          } else {
            setIsConfigCollapsed(false);
          }
        }
      }
    });
    return () => { chrome.runtime.onMessage.removeListener(messageListener); };
  }, [isCurrentProviderConfigured, serviceProvider, setPendingAnalysis, setTextToAnalyze, setIsConfigCollapsed]);

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

  const combinedError = error || translationError;
  const isBusy = isLoading || (serviceProvider === 'google' && areModelsLoading);

  return (
    <div className="relative flex flex-col h-screen bg-app-bg-light dark:bg-app-bg-dark">
      <div className="absolute top-2 right-4 z-10 flex items-center space-x-2">
        <button onClick={() => setIsNightMode(!isNightMode)} className="p-1.5 text-text-subtle-light dark:text-text-subtle-dark hover:bg-container-border-light dark:hover:bg-container-border-dark rounded-full focus:outline-none" title={t('night_mode_toggle_tooltip')}>
          {isNightMode ? <SunIcon className="w-5 h-5 text-sun-icon-light" /> : <MoonIcon className="w-5 h-5 text-moon-icon-light" />}
        </button>
        <LanguageSwitcher />
      </div>
      <div className="flex flex-col flex-1 w-full p-2 md:p-4 overflow-y-auto text-text-main-light dark:text-text-main-dark">
        <header className="mb-1 text-left">
          <div className="inline-flex items-center justify-center">
             <HootSpotLogoIcon className="w-9 h-9 md:w-13 md:h-13 text-logo-icon-light dark:text-logo-icon-dark mr-2 md:mr-3 ml-2.5" />
            <div>
                <h1 className="text-lg md:text-3xl font-semibold text-text-main-light dark:text-text-main-dark">{t('app_title')}</h1>
            </div>
          </div>
        </header>

        <main className="flex-grow">
          <ApiKeyManager
            serviceProvider={serviceProvider}
            onServiceProviderChange={setServiceProvider}
            apiKeyInput={apiKeyInput}
            onApiKeyInputChange={setApiKeyInput}
            currentMaxCharLimit={maxCharLimit}
            onMaxCharLimitSave={handleMaxCharLimitSave}
            models={models}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            areModelsLoading={areModelsLoading}
            modelsError={modelsError}
            lmStudioUrl={lmStudioUrl}
            onLmStudioUrlChange={setLmStudioUrl}
            lmStudioModel={lmStudioModel}
            onLmStudioModelChange={setLmStudioModel}
            isNightMode={isNightMode}
            onNightModeChange={setIsNightMode}
            includeRebuttalInJson={includeRebuttalInJson}
            onIncludeRebuttalInJsonChange={setIncludeRebuttalInJson}
            includeRebuttalInPdf={includeRebuttalInPdf}
            onIncludeRebuttalInPdfChange={setIncludeRebuttalInPdf}
            onConfigured={(configured) => {
                if (configured) setIsConfigCollapsed(true);
            }}
            isCurrentProviderConfigured={isCurrentProviderConfigured}
            isCollapsed={isConfigCollapsed}
            onToggleCollapse={() => setIsConfigCollapsed(!isConfigCollapsed)}
          />
          <TextAnalyzer
            ref={textareaRef}
            text={textToAnalyze}
            onTextChange={(newText) => {
                setTextToAnalyze(newText);
            }}
            onAnalyze={handleAnalyzeText}
            isLoading={isBusy}
            maxCharLimit={maxCharLimit}
            onJsonLoad={handleJsonLoad}
            hasApiKey={isCurrentProviderConfigured}
          />
          {(isLoading || isTranslating) && (
            <div className="my-4 p-3 rounded-md text-sm bg-info-bg-light text-info-text-light border border-info-border-light dark:bg-info-bg-dark dark:text-info-text-dark dark:border-info-border-dark flex items-center justify-center">
              <div className="spinner w-5 h-5 border-t-link-light mr-2"></div>
              {areModelsLoading ? t('config_model_loading') : (isLoading ? t('analyzer_button_analyzing') : t('info_translating_results'))}
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
              <span>{t(error) || error}</span>
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
          {!isBusy && !error && !analysisResult && currentTextAnalyzed && !isCurrentProviderConfigured && (
            <div className="mt-4 p-4 bg-warning-bg-light border border-warning-border-light text-warning-text-light dark:bg-warning-bg-dark dark:text-warning-text-dark dark:border-warning-border-dark rounded-md shadow-md">
                {t('analyzer_no_api_key_warning')}
            </div>
          )}
          {!isBusy && !error && !analysisResult && !currentTextAnalyzed && isCurrentProviderConfigured && (
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
