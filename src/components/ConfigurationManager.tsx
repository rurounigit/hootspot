// src/components/ConfigurationManager.tsx
import React, { useState, useEffect } from 'react';
import { SaveIcon, SettingsIcon } from '../assets/icons';
import { API_KEY_STORAGE_KEY, LM_STUDIO_URL_KEY, LM_STUDIO_MODEL_KEY } from '../config/storage-keys';
import { testApiKey } from '../api/google/utils';
import { testLMStudioConnection } from '../api/lm-studio';
import { useTranslation } from '../i18n';
import LanguageManager from './LanguageManager';
import { GroupedModels } from '../hooks/useModels';
import GoogleConfig from './config/GoogleConfig';
import LMStudioConfig from './config/LMStudioConfig';
import GeneralSettings from './config/GeneralSettings';

interface ConfigurationManagerProps {
  serviceProvider: 'google' | 'local';
  onServiceProviderChange: (provider: 'google' | 'local') => void;
  apiKeyInput: string;
  onApiKeyInputChange: (key: string) => void;
  models: GroupedModels;
  selectedModel: string;
  onModelChange: (model: string) => void;
  areModelsLoading: boolean;
  modelsError: string | null;
  lmStudioUrl: string;
  onLmStudioUrlChange: (url: string) => void;
  lmStudioModel: string;
  onLmStudioModelChange: (model: string) => void;
  currentMaxCharLimit: number;
  onMaxCharLimitSave: (limit: number) => void;
  isNightMode: boolean;
  onNightModeChange: (value: boolean) => void;
  includeRebuttalInJson: boolean;
  onIncludeRebuttalInJsonChange: (value: boolean) => void;
  includeRebuttalInPdf: boolean;
  onIncludeRebuttalInPdfChange: (value: boolean) => void;
  onConfigured: (isConfigured: boolean) => void;
  isCurrentProviderConfigured: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}
const ConfigurationManager: React.FC<ConfigurationManagerProps> = ({
  serviceProvider,
  onServiceProviderChange,
  apiKeyInput,
  onApiKeyInputChange,
  models,
  selectedModel,
  onModelChange,
  areModelsLoading,
  modelsError,
  lmStudioUrl,
  onLmStudioUrlChange,
  lmStudioModel,
  onLmStudioModelChange,
  currentMaxCharLimit,
  onMaxCharLimitSave,
  isNightMode,
  onNightModeChange,
  includeRebuttalInJson,
  onIncludeRebuttalInJsonChange,
  includeRebuttalInPdf,
  onIncludeRebuttalInPdfChange,
  onConfigured,
  isCurrentProviderConfigured,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { t } = useTranslation();
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isCollapsed) {
        setTestStatus(null);
        return;
    }

    if (serviceProvider === 'google') {
        if (!apiKeyInput.trim()) {
            setTestStatus({ message: t('error_api_key_empty'), type: 'error' });
        } else {
            setTestStatus(null);
        }
    } else {
        if (!lmStudioUrl.trim() || !lmStudioModel.trim()) {
            setTestStatus({ message: t('error_local_server_config_missing'), type: 'error' });
        } else {
            setTestStatus(null);
        }
    }
  }, [isCollapsed, serviceProvider, apiKeyInput, lmStudioUrl, lmStudioModel, t]);

  const handleSave = async () => {
    if (serviceProvider === 'google' && !apiKeyInput.trim()) {
      setTestStatus({ message: t('error_api_key_empty'), type: 'error' });
      return;
    }
    if (serviceProvider === 'local' && (!lmStudioUrl.trim() || !lmStudioModel.trim())) {
      setTestStatus({ message: t('error_local_server_config_missing'), type: 'error' });
      return;
    }

    setIsTesting(true);
    setTestStatus(null);
    try {
      if (serviceProvider === 'google') {
        const trimmedApiKey = apiKeyInput.trim();
        await testApiKey(trimmedApiKey, t, selectedModel);
        localStorage.setItem(API_KEY_STORAGE_KEY, trimmedApiKey);
        localStorage.removeItem(LM_STUDIO_URL_KEY);
        localStorage.removeItem(LM_STUDIO_MODEL_KEY);
        onConfigured(true);
        setTestStatus({ message: t('success_api_key_saved'), type: 'success' });
      } else {
        const trimmedUrl = lmStudioUrl.trim();
        const trimmedModel = lmStudioModel.trim();
        await testLMStudioConnection(trimmedUrl, trimmedModel, t);
        localStorage.setItem(LM_STUDIO_URL_KEY, trimmedUrl);
        localStorage.setItem(LM_STUDIO_MODEL_KEY, trimmedModel);
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        onConfigured(true);
        setTestStatus({ message: t('success_local_connection'), type: 'success' });
      }
      onToggleCollapse();
    } catch (err: any) {
      onConfigured(false);
      setTestStatus({ message: (err as Error).message, type: 'error' });
    } finally {
      setIsTesting(false);
    }
  };

  const isGoogleProvider = serviceProvider === 'google';

  return (
    <div className="bg-panel-bg-light dark:bg-panel-bg-dark shadow-md rounded-lg p-4 mb-4 border border-panel-border-light dark:border-panel-border-dark">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center"><SettingsIcon className="w-6 h-6 mr-2 text-link-light dark:text-link-dark" /><h2 className="text-lg font-semibold text-text-label-light dark:text-text-label-dark">{t('config_title')}</h2></div>
        <button onClick={onToggleCollapse} className="text-link-light hover:text-link-hover-light" aria-label={isCollapsed ? t('config_toggle_expand') : t('config_toggle_collapse')}>
          {isCollapsed ? (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg>)}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-label-light dark:text-text-label-dark mb-2">{t('config_provider_title')}</label>
            <div className="flex rounded-md shadow-sm">
              <button onClick={() => onServiceProviderChange('google')} className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-md focus:outline-none ${isGoogleProvider ? 'bg-blue-600 text-white' : 'bg-input-bg-light dark:bg-input-bg-dark text-text-label-light dark:text-text-label-dark hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                {t('config_provider_google')}
              </button>
              <button onClick={() => onServiceProviderChange('local')} className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-md focus:outline-none ${!isGoogleProvider ? 'bg-blue-600 text-white' : 'bg-input-bg-light dark:bg-input-bg-dark text-text-label-light dark:text-text-label-dark hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                {t('config_provider_local')}
              </button>
            </div>
          </div>

          {isGoogleProvider ? (
            <GoogleConfig
              apiKeyInput={apiKeyInput}
              onApiKeyInputChange={onApiKeyInputChange}
              models={models}
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              areModelsLoading={areModelsLoading}
              modelsError={modelsError}
            />
          ) : (
            <LMStudioConfig
              lmStudioUrl={lmStudioUrl}
              onLmStudioUrlChange={onLmStudioUrlChange}
              lmStudioModel={lmStudioModel}
              onLmStudioModelChange={onLmStudioModelChange}
            />
          )}

          <GeneralSettings
            currentMaxCharLimit={currentMaxCharLimit}
            onMaxCharLimitSave={onMaxCharLimitSave}
            isNightMode={isNightMode}
            onNightModeChange={onNightModeChange}
            includeRebuttalInJson={includeRebuttalInJson}
            onIncludeRebuttalInJsonChange={onIncludeRebuttalInJsonChange}
            includeRebuttalInPdf={includeRebuttalInPdf}
            onIncludeRebuttalInPdfChange={onIncludeRebuttalInPdfChange}
          />

          <button onClick={handleSave} disabled={isTesting} className="mt-6 w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-button-disabled-bg-light dark:disabled:bg-button-disabled-bg-dark">
            {isTesting ? ( <div className="spinner w-5 h-5 border-t-white mr-2"></div> ) : ( <SaveIcon className="w-5 h-5 mr-2" /> )}
            {isTesting ? t('config_button_saving') : t('config_button_save_test')}
          </button>

          {testStatus && ( <div className={`mt-4 p-3 rounded-md text-sm ${testStatus.type === 'success' ? 'bg-success-bg-light text-success-text-light border border-success-border-light dark:bg-success-bg-dark dark:text-success-text-dark dark:border-success-border-dark' : 'bg-error-bg-light text-error-text-light border border-error-border-light dark:bg-error-bg-dark dark:text-error-text-dark dark:border-error-border-dark'}`}> {testStatus.message} </div> )}

          <LanguageManager apiKey={apiKeyInput} />
        </>
      )}
       {isCollapsed && isCurrentProviderConfigured && ( <p className="text-sm text-success-text-light dark:text-success-text-dark">{t('config_is_configured')}</p> )}
       {isCollapsed && !isCurrentProviderConfigured && ( <p className="text-sm text-error-text-light dark:text-error-text-dark">{t('config_not_configured')}</p> )}
    </div>
  );
};

export default ConfigurationManager;