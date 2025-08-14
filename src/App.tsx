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
import { HootSpotLogoIcon, SunIcon, MoonIcon } from './assets/icons';
import Tooltip from './components/common/Tooltip';
import { useTranslationManager } from './hooks/useTranslationManager';
import { GEMINI_MODEL_NAME } from './config/api-prompts';

const App: React.FC = () => {
  const { t } = useTranslation();
  const {
    serviceProvider, setServiceProvider,
    cloudProvider, setCloudProvider,
    localProviderType, setLocalProviderType,
    apiKeyInput, setApiKeyInput,
    openRouterApiKey, setOpenRouterApiKey,
    googleModel, setGoogleModel,
    openRouterModel, setOpenRouterModel,
    debouncedApiKey,
    debouncedOpenRouterApiKey,
    lmStudioUrl, setLmStudioUrl,
    lmStudioModel, setLmStudioModel,
    ollamaUrl, setOllamaUrl,
    ollamaModel, setOllamaModel,
    maxCharLimit,
    isNightMode, setIsNightMode,
    includeRebuttalInJson, setIncludeRebuttalInJson,
    includeRebuttalInPdf, setIncludeRebuttalInPdf,
    showAllVersions, setShowAllVersions,
    isConfigCollapsed, setIsConfigCollapsed,
    isCurrentProviderConfigured, isTesting, testStatus,
    saveAndTestConfig, handleMaxCharLimitSave,
    invalidateConfig,
    isOpenRouterApiKeyValid,
    openRouterApiKeyTestStatus
  } = useConfig();

  const { models, isLoading: areModelsLoading, error: modelsError, refetch: refetchModels } = useModels({
    serviceProvider, cloudProvider, localProviderType,
    apiKey: debouncedApiKey,
    openRouterApiKey: openRouterApiKey,
    lmStudioUrl, ollamaUrl,
    showAllVersions
  });

  const selectedModel = serviceProvider === 'cloud' && cloudProvider === 'google'
    ? googleModel
    : openRouterModel;

    const {
    isTranslatingRebuttal, handleRebuttalUpdate, displayedRebuttal,
    translationError: translationErrorObject, loadRebuttal, clearTranslationError,
  } = useTranslationManager({
      serviceProvider, cloudProvider, localProviderType,
      apiKey: apiKeyInput,
      openRouterApiKey: openRouterApiKey,
      googleModel: googleModel,
      openRouterModel: openRouterModel,
      lmStudioConfig: { url: lmStudioUrl, model: lmStudioModel },
      ollamaConfig: { url: ollamaUrl, model: ollamaModel },
      isCurrentProviderConfigured,
  });

  const {
    isLoading, error: analysisErrorObject, analysisResult,
    currentTextAnalyzed, textToAnalyze, setTextToAnalyze,
    setPendingAnalysis, isTranslating, handleAnalyzeText,
    handleJsonLoad, analysisReportRef, displayedAnalysis, clearError: clearAnalysisError,
  } = useAnalysis(
    serviceProvider, localProviderType,
    apiKeyInput, lmStudioUrl, lmStudioModel,
    ollamaUrl, ollamaModel, selectedModel,
    isCurrentProviderConfigured, setIsConfigCollapsed,
    loadRebuttal,
    cloudProvider,
    openRouterApiKey,
    openRouterModel
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textWasSetProgrammatically = useRef(false);
  const lastAction = useRef<'PUSH' | 'APPEND'>('PUSH');

  useEffect(() => {
    let modelList: any[] = [], currentSelection, setSelection;

    if (serviceProvider === 'cloud') {
        if (cloudProvider === 'google') {
            modelList = [...models.stable, ...models.preview, ...(models.experimental || [])];
            currentSelection = googleModel;
            setSelection = setGoogleModel;
        } else if (cloudProvider === 'openrouter') {
            modelList = models.stable;
            currentSelection = openRouterModel;
            setSelection = setOpenRouterModel;
        }
    } else {
        modelList = models.stable;
        if (localProviderType === 'lm-studio') {
            currentSelection = lmStudioModel;
            setSelection = setLmStudioModel;
        } else { // ollama
            currentSelection = ollamaModel;
            setSelection = setOllamaModel;
        }
    }

    if (modelList.length > 0 && setSelection && (!currentSelection || !modelList.some(m => m.name === currentSelection))) {
        const preferredDefault = modelList.find(m => m.name === GEMINI_MODEL_NAME);
        if (preferredDefault && serviceProvider === 'cloud' && cloudProvider === 'google') {
            setSelection(preferredDefault.name);
        } else {
            setSelection(modelList[0].name);
        }
    }
  }, [models, serviceProvider, cloudProvider, googleModel, setGoogleModel, openRouterModel, setOpenRouterModel, lmStudioModel, setLmStudioModel, ollamaModel, setOllamaModel]);

  useEffect(() => {
    const messageListener = (request: any) => {
      if (request.type === 'PUSH_TEXT_TO_PANEL' && request.text) {
        lastAction.current = 'PUSH';
        textWasSetProgrammatically.current = true;
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
        textWasSetProgrammatically.current = true;
        setTextToAnalyze(prevText => `${prevText.trim() ? `${prevText}\n\n` : ''}${request.text}`);
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    chrome.runtime.sendMessage({ type: 'PULL_INITIAL_TEXT' }, (response) => {
      if (chrome.runtime.lastError) { return; }
      if (response?.text) {
        lastAction.current = 'PUSH';
        textWasSetProgrammatically.current = true;
        setTextToAnalyze(prev => (prev === '' ? response.text : prev));
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
  }, [isCurrentProviderConfigured, setPendingAnalysis, setTextToAnalyze, setIsConfigCollapsed]);

  useEffect(() => {
    if (analysisErrorObject?.type === 'config') {
      invalidateConfig(analysisErrorObject.message);
      clearAnalysisError();
    }
  }, [analysisErrorObject, invalidateConfig, clearAnalysisError]);

  useEffect(() => {
    if (translationErrorObject?.type === 'config') {
      invalidateConfig(translationErrorObject.message);
      clearTranslationError();
    }
  }, [translationErrorObject, invalidateConfig, clearTranslationError]);

  const generalAnalysisError = analysisErrorObject?.type === 'general' ? analysisErrorObject.message : null;
  const generalTranslationError = translationErrorObject?.type === 'general' ? translationErrorObject.message : null;
  const combinedError = generalAnalysisError || generalTranslationError;

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

  const isBusy = isLoading || areModelsLoading;

  return (
    <div className="relative flex flex-col h-screen bg-gray-100 dark:bg-gray-600">
      <div className="absolute top-2 right-4 z-20 flex items-center space-x-2">
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
            serviceProvider={serviceProvider} onServiceProviderChange={setServiceProvider}
            cloudProvider={cloudProvider} onCloudProviderChange={setCloudProvider}
            localProviderType={localProviderType} onLocalProviderTypeChange={setLocalProviderType}
            apiKeyInput={apiKeyInput} onApiKeyInputChange={setApiKeyInput}
            openRouterApiKey={openRouterApiKey} onOpenRouterApiKeyChange={setOpenRouterApiKey}
            openRouterModel={openRouterModel} onOpenRouterModelChange={setOpenRouterModel}
            lmStudioUrl={lmStudioUrl} onLmStudioUrlChange={setLmStudioUrl}
            lmStudioModel={lmStudioModel} onLmStudioModelChange={setLmStudioModel}
            ollamaUrl={ollamaUrl} onOllamaUrlChange={setOllamaUrl}
            ollamaModel={ollamaModel} onOllamaModelChange={setOllamaModel}
            models={models} googleModel={googleModel} onGoogleModelChange={setGoogleModel}
            areModelsLoading={areModelsLoading} modelsError={modelsError} onRefetchModels={refetchModels}
            currentMaxCharLimit={maxCharLimit} onMaxCharLimitSave={handleMaxCharLimitSave}
            isNightMode={isNightMode} onNightModeChange={setIsNightMode}
            includeRebuttalInJson={includeRebuttalInJson} onIncludeRebuttalInJsonChange={setIncludeRebuttalInJson}
            includeRebuttalInPdf={includeRebuttalInPdf} onIncludeRebuttalInPdfChange={setIncludeRebuttalInPdf}
            showAllVersions={showAllVersions} onShowAllVersionsChange={setShowAllVersions}
            isCurrentProviderConfigured={isCurrentProviderConfigured}
            isCollapsed={isConfigCollapsed} onToggleCollapse={() => setIsConfigCollapsed(!isConfigCollapsed)}
            isTesting={isTesting} testStatus={testStatus} onSave={saveAndTestConfig}
            isOpenRouterApiKeyValid={isOpenRouterApiKeyValid}
            openRouterApiKeyTestStatus={openRouterApiKeyTestStatus}
          />
          <TextAnalyzer
            ref={textareaRef}
            text={textToAnalyze}
            onTextChange={setTextToAnalyze}
            onAnalyze={() => handleAnalyzeText(textToAnalyze)}
            isLoading={isBusy}
            maxCharLimit={maxCharLimit}
            onJsonLoad={handleJsonLoad}
            hasApiKey={isCurrentProviderConfigured}
            serviceProvider={serviceProvider}
          />
          {(isLoading || isTranslating || isTranslatingRebuttal) && (
            <div className="my-4 p-3 rounded-md text-sm bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700 flex items-center justify-center">
              <div className="spinner w-5 h-5 border-t-blue-600 mr-2"></div>
              {areModelsLoading ? t('config_model_loading') : (isLoading ? t('analyzer_button_analyzing') : (isTranslating ? t('info_translating_results') : t('info_translating_rebuttal')))}
            </div>
          )}
          {combinedError && (
            <div className="my-6 p-4 bg-red-100 border border-red-300 text-red-700 dark:bg-red-900/50 dark:text-red-300 dark:border-red-500 rounded-md shadow-md" role="alert">
              <strong className="font-bold">{t('error_prefix')}</strong>
              <span>{t(combinedError) || combinedError}</span>
            </div>
          )}
          <div ref={analysisReportRef} className="mt-2">
            {(!isLoading && !isTranslating && !combinedError && displayedAnalysis) && (
               <AnalysisReport
                    analysis={displayedAnalysis}
                    sourceText={currentTextAnalyzed}
                    rebuttal={displayedRebuttal}
                    isTranslatingRebuttal={isTranslatingRebuttal}
                    onRebuttalUpdate={handleRebuttalUpdate}
                    includeRebuttalInJson={includeRebuttalInJson}
                    includeRebuttalInPdf={includeRebuttalInPdf}
                    serviceProvider={serviceProvider}
                    cloudProvider={cloudProvider}
                    localProviderType={localProviderType}
                    apiKey={apiKeyInput}
                    googleModel={googleModel}
                    lmStudioConfig={{ url: lmStudioUrl, model: lmStudioModel }}
                    ollamaConfig={{ url: ollamaUrl, model: ollamaModel }}
                    isCurrentProviderConfigured={isCurrentProviderConfigured}
                    openRouterApiKey={openRouterApiKey}
                    openRouterModel={openRouterModel}
               />
            )}
          </div>
          {!isBusy && !combinedError && !analysisResult && !currentTextAnalyzed && isCurrentProviderConfigured && (
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
            <span className="mx-2">•</span>
            <a
              href="https://github.com/rurounigit/hootspot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:underline"
            >
              {t('app_footer_help_code')}
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
