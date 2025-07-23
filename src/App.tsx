// src/App.tsx

import React, { useEffect, useRef } from 'react';
import ConfigurationManager from './components/ConfigurationManager';
import TextAnalyzer from './components/TextAnalyzer';
import AnalysisReport from './components/analysis/AnalysisReport';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useTranslation } from './i18n';
import { useModels } from './hooks/useModels';
import { useConfig } from './hooks/useConfig';
import { useAnalysis } from './hooks/useAnalysis';
import { useTranslationManager } from './hooks/useTranslationManager';
import { HootSpotLogoIcon, SunIcon, MoonIcon } from './assets/icons';
import Tooltip from './components/common/Tooltip';

const App: React.FC = () => {
  const { t } = useTranslation();
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
    isTranslatingRebuttal,
    handleRebuttalUpdate,
    displayedRebuttal,
    translationError,
  } = useTranslationManager(
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
    <div className="relative flex flex-col h-screen bg-gray-100 dark:bg-gray-600">
      <div className="absolute top-2 right-4 z-10 flex items-center space-x-2">
        <button onClick={() => setIsNightMode(!isNightMode)} className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full focus:outline-none" title={t('night_mode_toggle_tooltip')}>
          {isNightMode ? <SunIcon className="w-5 h-5 text-amber-500" /> : <MoonIcon className="w-5 h-5 text-gray-600" />}
        </button>
        <LanguageSwitcher />
      </div>
      <div className="flex flex-col flex-1 w-full p-2 md:p-4 overflow-y-auto text-gray-800 dark:text-gray-50">
        <header className="mb-1 text-left">
          <div className="inline-flex items-center justify-center">
             <HootSpotLogoIcon className="w-9 h-9 md:w-13 md:h-13 text-blue-600 dark:text-blue-400 mr-2 md:mr-3 ml-2.5" />
            <div>
                <h1 className="text-lg md:text-3xl font-semibold text-gray-800 dark:text-gray-50">{t('app_title')}</h1>
            </div>
          </div>
        </header>

        <main className="flex-grow">
          <ConfigurationManager
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
            <div className="my-4 p-3 rounded-md text-sm bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700 flex items-center justify-center">
              <div className="spinner w-5 h-5 border-t-blue-600 mr-2"></div>
              {areModelsLoading ? t('config_model_loading') : (isLoading ? t('analyzer_button_analyzing') : t('info_translating_results'))}
            </div>
          )}
          {isTranslatingRebuttal && (
            <div className="my-4 p-3 rounded-md text-sm bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700 flex items-center justify-center">
              <div className="spinner w-5 h-5 border-t-blue-600 mr-2"></div>
              {t('info_translating_rebuttal')}
            </div>
          )}
          {combinedError && (
            <div className="my-6 p-4 bg-red-100 border border-red-300 text-red-700 dark:bg-red-900/50 dark:text-red-300 dark:border-red-500 rounded-md shadow-md" role="alert">
              <strong className="font-bold">{t('error_prefix')}</strong>
              <span>{t(combinedError) || combinedError}</span>
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
                    serviceProvider={serviceProvider}
                    lmStudioUrl={lmStudioUrl}
                    lmStudioModel={lmStudioModel}
               />
            )}
          </div>
          {!isBusy && !error && !analysisResult && !currentTextAnalyzed && isCurrentProviderConfigured && (
            <div className="mt-4 p-6 bg-white border border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 rounded-lg shadow-md text-center">
                <p className="text-lg">{t('info_enter_text_to_analyze')}</p>
                <p className="text-sm mt-2">{t('info_uncover_patterns')}</p>
            </div>
          )}
        </main>
        <footer className="mt-auto pt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <div>
            {t('app_footer_copyright', { year: new Date().getFullYear() })}
            <Tooltip content={t('app_footer_responsibility')}>
              <span className="ml-2 underline decoration-dotted cursor-pointer">
                {t('app_footer_disclaimer_label')}
              </span>
            </Tooltip>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;