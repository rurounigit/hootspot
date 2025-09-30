// src/components/ConfigurationManager.tsx
import React, { useEffect, useState } from 'react';
import { SaveIcon, SettingsIcon } from '../assets/icons';
import { useTranslation } from '../i18n';
import LanguageManager from './LanguageManager';
import { GroupedModels } from '../types/api';
import CloudConfig from './config/CloudConfig';
import LocalProviderConfig from './config/LocalProviderConfig';
import GeneralSettings from './config/GeneralSettings';

interface ConfigurationManagerProps {
  serviceProvider: 'cloud' | 'local';
  onServiceProviderChange: (provider: 'cloud' | 'local') => void;
  cloudProvider: 'google' | 'openrouter';
  onCloudProviderChange: (provider: 'google' | 'openrouter') => void;
  localProviderType: 'lm-studio' | 'ollama';
  onLocalProviderTypeChange: (type: 'lm-studio' | 'ollama') => void;

  apiKeyInput: string;
  onApiKeyInputChange: (key: string) => void;
  openRouterApiKey: string;
  onOpenRouterApiKeyChange: (key: string) => void;

  lmStudioUrl: string;
  onLmStudioUrlChange: (url: string) => void;
  lmStudioModel: string;
  onLmStudioModelChange: (model: string) => void;

  ollamaUrl: string;
  onOllamaUrlChange: (url: string) => void;
  ollamaModel: string;
  onOllamaModelChange: (model: string) => void;

  models: GroupedModels;
  googleModel: string;
  onGoogleModelChange: (model: string) => void;
  openRouterModel: string;
  onOpenRouterModelChange: (model: string) => void;

  areModelsLoading: boolean;
  modelsError: string | null;
  onRefetchModels: () => void;

  currentMaxCharLimit: number;
  onMaxCharLimitSave: (limit: number) => void;
  isNightMode: boolean;
  onNightModeChange: (value: boolean) => void;
  includeRebuttalInJson: boolean;
  onIncludeRebuttalInJsonChange: (value: boolean) => void;
  includeRebuttalInPdf: boolean;
  onIncludeRebuttalInPdfChange: (value: boolean) => void;
  showAllVersions: boolean;
  onShowAllVersionsChange: (value: boolean) => void;

  isCurrentProviderConfigured: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isTesting: boolean;
  testStatus: { message: string, type: 'success' | 'error', details?: Record<string, any> } | null;
  onSave: () => void;

}

const ConfigurationManager: React.FC<ConfigurationManagerProps> = (props) => {
  const {
    serviceProvider, onServiceProviderChange,
    localProviderType, onLocalProviderTypeChange,
    apiKeyInput, lmStudioUrl, onLmStudioUrlChange, lmStudioModel, onLmStudioModelChange,
    ollamaUrl, onOllamaUrlChange, ollamaModel, onOllamaModelChange,
    models, areModelsLoading, modelsError, onRefetchModels,
    isCurrentProviderConfigured, isCollapsed, onToggleCollapse,
    isTesting, testStatus, onSave, openRouterModel
  } = props;
  const { t } = useTranslation();
  const [localError, setLocalError] = useState<string | null>(null);

  const isCloudProvider = serviceProvider === 'cloud';

  const isFormValid = () => {
    if (isCloudProvider) {
      if (props.cloudProvider === 'google') {
        return props.apiKeyInput.trim() !== '' && props.googleModel.trim() !== '';
      }
      // OpenRouter case - no API key validation needed
      return props.openRouterApiKey.trim() !== '' && props.openRouterModel.trim() !== '';
    }
    // Local provider validation - more lenient to allow for model loading
    if (localProviderType === 'lm-studio') {
      return lmStudioUrl.trim() !== '' && lmStudioModel.trim() !== '';
    }
    return ollamaUrl.trim() !== '' && ollamaModel.trim() !== '';
  };

  const isSaveDisabled = isTesting || !isFormValid() || (isCloudProvider && (areModelsLoading || !!modelsError)) ||
    // Additional safeguard: Always disable Save & Test for Google API when API key is empty
    (isCloudProvider && props.cloudProvider === 'google' && !props.apiKeyInput.trim());

  useEffect(() => {
    if (isCollapsed) {
        setLocalError(null);
        return;
    }
    if (isCloudProvider) {
      if (props.cloudProvider === 'google' && !props.apiKeyInput.trim()) {
        setLocalError(t('error_api_key_empty'));
      } else if (props.cloudProvider === 'openrouter' && !props.openRouterApiKey.trim()) {
        setLocalError(t('error_api_key_empty'));
      } else {
        setLocalError(null);
      }
    } else {
      // More granular local provider error handling
      if (localProviderType === 'lm-studio') {
        if (!lmStudioUrl.trim()) {
          setLocalError(t('error_local_server_config_missing'));
        } else if (!lmStudioModel.trim() && !areModelsLoading && models.stable.length > 0) {
          // Only show error if models are loaded and available but none selected
          setLocalError(t('error_local_server_config_missing'));
        } else {
          setLocalError(null);
        }
      } else {
        if (!ollamaUrl.trim()) {
          setLocalError(t('error_local_server_config_missing'));
        } else if (!ollamaModel.trim() && !areModelsLoading && models.stable.length > 0) {
          // Only show error if models are loaded and available but none selected
          setLocalError(t('error_local_server_config_missing'));
        } else {
          setLocalError(null);
        }
      }
    }
  }, [isCollapsed, serviceProvider, props.cloudProvider, props.apiKeyInput, props.openRouterApiKey, lmStudioUrl, lmStudioModel, ollamaUrl, ollamaModel, localProviderType, t, models, areModelsLoading, modelsError]);

  const renderCollapsedStatus = () => {
    const providerName = isCloudProvider ? (props.cloudProvider === 'google' ? 'Google' : 'OpenRouter') : (localProviderType === 'ollama' ? 'Ollama' : 'LM Studio');
    if (isCurrentProviderConfigured) {
      return <p className="text-sm text-green-600 dark:text-green-400">{t('config_status_configured', { provider: providerName })}</p>;
    }
    return <p className="text-sm text-red-600 dark:text-red-400">{t('config_status_unconfigured', { provider: providerName })}</p>;
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center"><SettingsIcon className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" /><h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('config_title')}</h2></div>
        <button onClick={onToggleCollapse} className="text-blue-600 hover:text-blue-800" aria-label={isCollapsed ? t('config_toggle_expand') : t('config_toggle_collapse')}>
          {isCollapsed ? (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg>)}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {!isCurrentProviderConfigured && (
            <div className="mb-4 p-3 rounded-md text-sm bg-yellow-50 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-400">
                {t('config_status_unsaved')}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('config_provider_title')}</label>
            <div className="flex rounded-md shadow-sm">
              <button onClick={() => onServiceProviderChange('cloud')} className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-md focus:outline-none ${isCloudProvider ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                {t('config_provider_cloud')}
              </button>
              <button onClick={() => onServiceProviderChange('local')} className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-md focus:outline-none ${!isCloudProvider ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                {t('config_provider_local')}
              </button>
            </div>
          </div>

          {isCloudProvider ? (
            <CloudConfig
              cloudProvider={props.cloudProvider}
              onCloudProviderChange={props.onCloudProviderChange}
              apiKeyInput={props.apiKeyInput}
              onApiKeyInputChange={props.onApiKeyInputChange}
              models={props.models}
              googleModel={props.googleModel}
              onGoogleModelChange={props.onGoogleModelChange}
              areModelsLoading={props.areModelsLoading}
              modelsError={props.modelsError}
              showAllVersions={props.showAllVersions}
              onShowAllVersionsChange={props.onShowAllVersionsChange}
              openRouterApiKey={props.openRouterApiKey}
              onOpenRouterApiKeyChange={props.onOpenRouterApiKeyChange}
              openRouterModel={props.openRouterModel}
              onOpenRouterModelChange={props.onOpenRouterModelChange}
            />
          ) : (
            <LocalProviderConfig
              localProviderType={localProviderType}
              onLocalProviderTypeChange={onLocalProviderTypeChange}
              lmStudioUrl={lmStudioUrl}
              onLmStudioUrlChange={onLmStudioUrlChange}
              ollamaUrl={ollamaUrl}
              onOllamaUrlChange={onOllamaUrlChange}
              models={models}
              selectedModel={localProviderType === 'lm-studio' ? lmStudioModel : ollamaModel}
              onModelChange={localProviderType === 'lm-studio' ? onLmStudioModelChange : onOllamaModelChange}
              areModelsLoading={areModelsLoading}
              modelsError={modelsError}
              onRefetchModels={onRefetchModels}
            />
          )}

          <GeneralSettings
            currentMaxCharLimit={props.currentMaxCharLimit}
            onMaxCharLimitSave={props.onMaxCharLimitSave}
            isNightMode={props.isNightMode}
            onNightModeChange={props.onNightModeChange}
            includeRebuttalInJson={props.includeRebuttalInJson}
            onIncludeRebuttalInJsonChange={props.onIncludeRebuttalInJsonChange}
            includeRebuttalInPdf={props.includeRebuttalInPdf}
            onIncludeRebuttalInPdfChange={props.onIncludeRebuttalInPdfChange}
          />

          <button onClick={onSave} disabled={isSaveDisabled} aria-label="save-and-test-configuration" className="mt-6 w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600">
            {isTesting ? ( <div className="spinner w-5 h-5 border-t-white mr-2"></div> ) : ( <SaveIcon className="w-5 h-5 mr-2" /> )}
            {isTesting ? t('config_button_saving') : t('config_button_save_test')}
          </button>

          {(localError && !testStatus) && ( <div className="mt-4 p-3 rounded-md text-sm bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-500"> {localError} </div> )}
          {testStatus && testStatus.type === 'error' && ( <div className={`mt-4 p-3 rounded-md text-sm bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-500`}> {t(testStatus.message, testStatus.details)} </div> )}
          {modelsError && !localError && !testStatus && (
            <div className="mt-4 p-3 rounded-md text-sm bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-500">
              {modelsError}
            </div>
          )}

          <LanguageManager
            serviceProvider={serviceProvider}
            cloudProvider={props.cloudProvider}
            localProviderType={localProviderType}
            apiKey={apiKeyInput}
            googleModel={props.googleModel} // Added prop
            openRouterApiKey={props.openRouterApiKey}
            openRouterModelName={openRouterModel} // Added prop
            lmStudioConfig={{ url: lmStudioUrl, model: lmStudioModel }}
            ollamaConfig={{ url: ollamaUrl, model: ollamaModel }}
            isCurrentProviderConfigured={isCurrentProviderConfigured}
          />
        </>
      )}
       {isCollapsed && renderCollapsedStatus()}
    </div>
  );
};

export default ConfigurationManager;
