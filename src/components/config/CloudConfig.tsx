// src/components/config/CloudConfig.tsx
import React from 'react';
import { useTranslation } from '../../i18n';
import GoogleConfig from './GoogleConfig';
import OpenRouterConfig from './OpenRouterConfig';
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
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('config_api_provider_label')}</label>
        <div className="flex rounded-md shadow-sm">
          <button onClick={() => props.onCloudProviderChange('google')} className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-md focus:outline-none ${isGoogleProvider ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            Google API
          </button>
          <button onClick={() => props.onCloudProviderChange('openrouter')} className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-md focus:outline-none ${!isGoogleProvider ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            OpenRouter
          </button>
        </div>
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