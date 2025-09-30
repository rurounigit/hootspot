// src/components/config/OpenRouterConfig.tsx
import React, { useState } from 'react';
import { useTranslation } from '../../i18n';
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onModelChange(e.target.value);
  };

  const allModels = models.stable || [];
  const filteredModels = allModels.filter((model) =>
    model.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const allModelsEmpty = allModels.length === 0;

  // Determine the description to display based on searchTerm and selectedModel
  let descriptionToShow: string | null = null;
  if (!areModelsLoading && !modelsError && filteredModels.length > 0) {
    const modelStillVisible = filteredModels.find(m => m.name === selectedModel);
    if (modelStillVisible) {
      // The originally selected model is still in the filtered list
      descriptionToShow = modelStillVisible.description;
    } else {
      // The originally selected model was filtered out, show the description of the first model in the new list
      descriptionToShow = filteredModels[0].description;
    }
  }


  return (
    <>
      <div className="mb-4">
        <label htmlFor="openRouterApiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('config_openrouter_api_key_label')}</label>
        <input type="password" id="openRouterApiKey" value={apiKey} onChange={(e) => onApiKeyChange(e.target.value)} placeholder={t('config_api_key_placeholder')} className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50" />
      </div>
      <div className="mb-6">
        <label htmlFor="modelSelector" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('config_model_label')}</label>
        <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">{t('config_openrouter_model_search_hint')}</p>
        <input
          type="text"
          placeholder="Search models..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50 mb-2"
        />
        <select
          id="modelSelector"
          value={selectedModel}
          onChange={handleModelChange}
          disabled={areModelsLoading || allModelsEmpty}
          className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600 bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50"
        >
          {areModelsLoading && <option value="">{t('config_model_loading')}</option>}
          {modelsError && <option value="">{t('config_model_error')}</option>}
          {!areModelsLoading && !modelsError && allModelsEmpty && <option value="">{t('config_openrouter_enter_api_key_to_see_models')}</option>}
          {!areModelsLoading && !modelsError && !allModelsEmpty &&
            filteredModels.map((model) => (
              <option key={model.name} value={model.name}>
                {model.displayName}
              </option>
            ))}
        </select>
        {!areModelsLoading && !modelsError && descriptionToShow && (
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            <p>{descriptionToShow}</p>
          </div>
        )}
      </div>
    </>
  );
};

export default OpenRouterConfig;
