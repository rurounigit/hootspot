// src/components/config/GoogleConfig.tsx

import React from 'react';
import { useTranslation } from '../../i18n';
import { GroupedModels } from '../../types/api';
import { InfoIcon, ExternalLinkIcon } from '../../assets/icons';

interface GoogleConfigProps {
  apiKeyInput: string;
  onApiKeyInputChange: (key: string) => void;
  models: GroupedModels;
  selectedModel: string;
  onModelChange: (model: string) => void;
  areModelsLoading: boolean;
  modelsError: string | null;
  showAllVersions: boolean;
  onShowAllVersionsChange: (value: boolean) => void;
}

const GoogleConfig: React.FC<GoogleConfigProps> = ({
  apiKeyInput,
  onApiKeyInputChange,
  models,
  selectedModel,
  onModelChange,
  areModelsLoading,
  modelsError,
  showAllVersions,
  onShowAllVersionsChange,
}) => {
  const { t } = useTranslation();
  const allModelsEmpty = models.preview.length === 0 && models.stable.length === 0 && (!models.experimental || models.experimental.length === 0);

  return (
    <>
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900 dark:border-blue-700">
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
      <div className="mb-4">
        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('config_api_key_label')}</label>
        <input type="password" id="apiKey" value={apiKeyInput} onChange={(e) => onApiKeyInputChange(e.target.value)} placeholder={t('config_api_key_placeholder')} className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50" />
      </div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="modelSelector" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('config_model_label')}</label>
          <div className="flex items-center">
            <label htmlFor="showAllVersionsCheckbox" className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">{t('config_show_all_versions_label')}</label>
            <input
              type="checkbox"
              id="showAllVersionsCheckbox"
              checked={showAllVersions}
              onChange={(e) => onShowAllVersionsChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        </div>
        <select id="modelSelector" value={selectedModel} onChange={(e) => onModelChange(e.target.value)} disabled={areModelsLoading || allModelsEmpty} className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600 bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50">
          {areModelsLoading && <option>{t('config_model_loading')}</option>}
          {modelsError && <option>{t('config_model_error')}</option>}
          {!areModelsLoading && !modelsError && allModelsEmpty && <option>Enter API Key to see models</option>}
          {!areModelsLoading && !modelsError && (
            <>
              {/* CORRECTED ORDER: Preview -> Stable -> Experimental */}
              {models.preview.length > 0 && (
                <optgroup label={t('config_model_preview_group')}>
                  {models.preview.map(model => ( <option key={model.name} value={model.name}> {model.displayName} </option>))}
                </optgroup>
              )}
              {models.stable.length > 0 && (
                <optgroup label={t('config_model_stable_group')}>
                  {models.stable.map(model => ( <option key={model.name} value={model.name}> {model.displayName} </option>))}
                </optgroup>
              )}
              {models.experimental && models.experimental.length > 0 && (
                <optgroup label={t('config_model_experimental_group')}>
                  {models.experimental.map(model => ( <option key={model.name} value={model.name}> {model.displayName} </option>))}
                </optgroup>
              )}
            </>
          )}
        </select>
        {modelsError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{modelsError}</p>}
      </div>
    </>
  );
};

export default GoogleConfig;