// src/components/config/CloudConfig.tsx
import React from 'react';
import { useTranslation } from '../../i18n';
import GoogleConfig from './GoogleConfig';
import OpenRouterConfig from './OpenRouterConfig';
import { InfoIcon, ExternalLinkIcon } from '../../assets/icons';
import { GroupedModels } from '../../types/api';

interface CloudConfigProps {
  cloudProvider: 'google' | 'openrouter';
  onCloudProviderChange: (provider: 'google' | 'openrouter') => void;
  apiKeyInput: string;
  onApiKeyInputChange: (key: string) => void;
  models: GroupedModels;
  googleModel: string;
  onGoogleModelChange: (model: string) => void;
  areModelsLoading: boolean;
  modelsError: string | null;
  showAllVersions: boolean;
  onShowAllVersionsChange: (value: boolean) => void;
  openRouterApiKey: string;
  onOpenRouterApiKeyChange: (key: string) => void;
  openRouterModel: string;
  onOpenRouterModelChange: (model: string) => void;
}

const CloudConfig: React.FC<CloudConfigProps> = (props) => {
  const { t } = useTranslation();
  const isGoogleProvider = props.cloudProvider === 'google';

  return (
    <div>
      <div className={`mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900 dark:border-blue-700 ${isGoogleProvider ? 'block' : 'hidden'}`}>
        <div className="flex items-start">
          <InfoIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-300">{t('config_api_key_info')}</p>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-sm font-medium inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              {t('config_get_api_key')} <ExternalLinkIcon className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>
      </div>
      <div className={`mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900 dark:border-blue-700 ${!isGoogleProvider ? 'block' : 'hidden'}`}>
        <div className="flex items-start">
          <InfoIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-300">{t('config_openrouter_api_key_info')}</p>
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-sm font-medium inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              {t('config_openrouter_get_api_key')} <ExternalLinkIcon className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="cloudProviderType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('config_api_provider_label')}</label>
        <select
          id="cloudProviderType"
          value={props.cloudProvider}
          onChange={(e) => props.onCloudProviderChange(e.target.value as 'google' | 'openrouter')}
          className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50"
        >
          <option value="google">Google API</option>
          <option value="openrouter">OpenRouter</option>
        </select>
      </div>

      {isGoogleProvider ? (
        <GoogleConfig
          apiKeyInput={props.apiKeyInput}
          onApiKeyInputChange={props.onApiKeyInputChange}
          models={props.models}
          selectedModel={props.googleModel}
          onModelChange={props.onGoogleModelChange}
          areModelsLoading={props.areModelsLoading}
          modelsError={props.modelsError}
          showAllVersions={props.showAllVersions}
          onShowAllVersionsChange={props.onShowAllVersionsChange}
        />
      ) : (
        <OpenRouterConfig
          apiKey={props.openRouterApiKey}
          onApiKeyChange={props.onOpenRouterApiKeyChange}
          selectedModel={props.openRouterModel}
          onModelChange={props.onOpenRouterModelChange}
          models={props.models}
          areModelsLoading={props.areModelsLoading}
          modelsError={props.modelsError}
        />
      )}
    </div>
  );
};

export default CloudConfig;
