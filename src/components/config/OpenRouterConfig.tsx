// src/components/config/OpenRouterConfig.tsx
import React, { useState } from 'react';
import { useTranslation } from '../../i18n';
import { InfoIcon, ExternalLinkIcon } from '../../assets/icons';
import { GroupedModels } from '../../types/api';

interface OpenRouterConfigProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  models: GroupedModels;
  areModelsLoading: boolean;
  modelsError: string | null;
}

const OpenRouterConfig: React.FC<OpenRouterConfigProps> = ({
  apiKey,
  onApiKeyChange,
  selectedModel,
  onModelChange,
  models,
  areModelsLoading,
  modelsError,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const allModels = models.stable || [];
  const filteredModels = allModels.filter((model) =>
    model.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const allModelsEmpty = allModels.length === 0;

  return (
    <>
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900 dark:border-blue-700">
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
        <label htmlFor="openRouterApiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('config_openrouter_api_key_label')}</label>
        <input type="password" id="openRouterApiKey" value={apiKey} onChange={(e) => onApiKeyChange(e.target.value)} placeholder={t('config_api_key_placeholder')} className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50" />
      </div>
      <div className="mb-6">
        <label htmlFor="modelSelector" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('config_model_label')}</label>
        <input
          type="text"
          placeholder="Search models..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50 mb-2"
        />
        <select id="modelSelector" value={selectedModel} onChange={(e) => onModelChange(e.target.value)} disabled={areModelsLoading || allModelsEmpty} className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600 bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50">
          {areModelsLoading && <option>{t('config_model_loading')}</option>}
          {modelsError && <option>{t('config_model_error')}</option>}
          {!areModelsLoading && !modelsError && allModelsEmpty && <option>{t('config_openrouter_enter_api_key_to_see_models')}</option>}
          {!areModelsLoading && !modelsError &&
            filteredModels.map((model) => (
              <option key={model.name} value={model.name}>
                {model.displayName}
              </option>
            ))}
        </select>
        {modelsError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{modelsError}</p>}
      </div>
    </>
  );
};

export default OpenRouterConfig;
