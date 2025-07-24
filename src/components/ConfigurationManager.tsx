// src/components/ConfigurationManager.tsx
import React, { useState, useEffect } from 'react';
import { SaveIcon, SettingsIcon } from '../assets/icons';
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
  isConfigDirty: boolean;
  handleConfigSave: () => void;
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
  isConfigDirty,
  handleConfigSave,
}) => {
  const { t } = useTranslation();
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isCollapsed || !isConfigDirty) {
        setTestStatus(null);
        return;
    }
    if (serviceProvider === 'google') {
        if (!apiKeyInput.trim()) setTestStatus({ message: t('error_api_key_empty'), type: 'error' });
        else if (modelsError) setTestStatus({ message: modelsError, type: 'error' });
        else setTestStatus(null);
    } else {
        if (!lmStudioUrl.trim() || !lmStudioModel.trim()) setTestStatus({ message: t('error_local_server_config_missing'), type: 'error' });
        else setTestStatus(null);
    }
  }, [isCollapsed, serviceProvider, apiKeyInput, lmStudioUrl, lmStudioModel, t, modelsError, isConfigDirty]);

  const isFormValid = () => {
    if (serviceProvider === 'google') return apiKeyInput.trim() !== '' && !modelsError;
    return lmStudioUrl.trim() !== '' && lmStudioModel.trim() !== '';
  };

  const handleSave = async () => {
    if (!isFormValid()) return;

    setIsTesting(true);
    setTestStatus(null);
    try {
      if (serviceProvider === 'google') {
        await testApiKey(apiKeyInput.trim(), t, selectedModel);
        setTestStatus({ message: t('success_api_key_saved'), type: 'success' });
      } else {
        await testLMStudioConnection(lmStudioUrl.trim(), lmStudioModel.trim(), t);
        setTestStatus({ message: t('success_local_connection'), type: 'success' });
      }
      handleConfigSave();
      onConfigured(true);
      setTimeout(() => {
        if (!isCollapsed) {
          onToggleCollapse();
        }
      }, 1000);
    } catch (err: any) {
      onConfigured(false);
      setTestStatus({ message: (err as Error).message, type: 'error' });
    } finally {
      setIsTesting(false);
    }
  };

  const renderCollapsedStatus = () => {
    const providerName = serviceProvider === 'google' ? 'Google' : 'Local';
    if (isConfigDirty) {
      return <p className="text-sm text-yellow-600 dark:text-yellow-400">{t('config_status_dirty', { provider: providerName })}</p>;
    }
    if (isCurrentProviderConfigured) {
      return <p className="text-sm text-green-600 dark:text-green-400">{t('config_status_configured', { provider: providerName })}</p>;
    }
    return <p className="text-sm text-red-600 dark:text-red-400">{t('config_status_unconfigured', { provider: providerName })}</p>;
  };

  const isGoogleProvider = serviceProvider === 'google';

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
          {isConfigDirty && (
            <div className="mb-4 p-3 rounded-md text-sm bg-yellow-50 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-400">
                {t('config_status_unsaved')}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('config_provider_title')}</label>
            <div className="flex rounded-md shadow-sm">
              <button onClick={() => onServiceProviderChange('google')} className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-md focus:outline-none ${isGoogleProvider ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                {t('config_provider_google')}
              </button>
              <button onClick={() => onServiceProviderChange('local')} className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-md focus:outline-none ${!isGoogleProvider ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
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

          <button onClick={handleSave} disabled={isTesting || !isFormValid()} aria-label="save-and-test-configuration" className="mt-6 w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600">
            {isTesting ? ( <div className="spinner w-5 h-5 border-t-white mr-2"></div> ) : ( <SaveIcon className="w-5 h-5 mr-2" /> )}
            {isTesting ? t('config_button_saving') : t('config_button_save_test')}
          </button>

          {testStatus && ( <div className={`mt-4 p-3 rounded-md text-sm ${testStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-500' : 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-500'}`}> {testStatus.message} </div> )}

          <LanguageManager
            serviceProvider={serviceProvider}
            apiKey={apiKeyInput}
            lmStudioUrl={lmStudioUrl}
            lmStudioModel={lmStudioModel}
            isCurrentProviderConfigured={isCurrentProviderConfigured}
          />
        </>
      )}
       {isCollapsed && renderCollapsedStatus()}
    </div>
  );
};
export default ConfigurationManager;