// src/components/config/GoogleConfig.tsx

import React from 'react';
import { useTranslation } from '../../i18n';
import { GroupedModels } from '../../hooks/useModels';
import { InfoIcon, ExternalLinkIcon } from '../../assets/icons';

interface GoogleConfigProps {
  apiKeyInput: string;
  onApiKeyInputChange: (key: string) => void;
  models: GroupedModels;
  selectedModel: string;
  onModelChange: (model: string) => void;
  areModelsLoading: boolean;
  modelsError: string | null;
}

const GoogleConfig: React.FC<GoogleConfigProps> = ({
  apiKeyInput,
  onApiKeyInputChange,
  models,
  selectedModel,
  onModelChange,
  areModelsLoading,
  modelsError,
}) => {
  const { t } = useTranslation();
  const allModelsEmpty = models.preview.length === 0 && models.stable.length === 0;

  return (
    <>
      <div className="mb-4 p-4 bg-info-bg-light border border-info-border-light rounded-md dark:bg-info-bg-dark dark:border-info-border-dark">
        <div className="flex items-start">
          <InfoIcon className="w-5 h-5 mr-2 text-link-light dark:text-link-dark flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-info-text-light dark:text-info-text-dark">{t('config_api_key_info')}</p>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-sm font-medium inline-flex items-center text-link-light hover:text-link-hover-light dark:text-link-dark dark:hover:text-link-hover-dark">
              {t('config_get_api_key')} <ExternalLinkIcon className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="apiKey" className="block text-sm font-medium text-text-label-light dark:text-text-label-dark mb-1">{t('config_api_key_label')}</label>
        <input type="password" id="apiKey" value={apiKeyInput} onChange={(e) => onApiKeyInputChange(e.target.value)} placeholder={t('config_api_key_placeholder')} className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-input-bg-light border-input-border-light text-input-text-light dark:bg-input-bg-dark dark:border-input-border-dark dark:text-input-text-dark" />
      </div>
      <div className="mb-6">
        <label htmlFor="modelSelector" className="block text-sm font-medium text-text-label-light dark:text-text-label-dark mb-1">{t('config_model_label')}</label>
        <select id="modelSelector" value={selectedModel} onChange={(e) => onModelChange(e.target.value)} disabled={areModelsLoading || allModelsEmpty} className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600 bg-input-bg-light border-input-border-light text-input-text-light dark:bg-input-bg-dark dark:border-input-border-dark dark:text-input-text-dark">
          {areModelsLoading && <option>{t('config_model_loading')}</option>}
          {modelsError && <option>{t('config_model_error')}</option>}
          {!areModelsLoading && !modelsError && allModelsEmpty && <option>Enter API Key to see models</option>}
          {!areModelsLoading && !modelsError && (<>
              {models.preview.length > 0 && ( <optgroup label={t('config_model_preview_group')}> {models.preview.map(model => ( <option key={model.name} value={model.name}> {model.displayName} </option> ))} </optgroup> )}
              {models.stable.length > 0 && ( <optgroup label={t('config_model_stable_group')}> {models.stable.map(model => ( <option key={model.name} value={model.name}> {model.displayName} </option>))} </optgroup> )}
          </>)}
        </select>
        {modelsError && <p className="text-xs text-error-text-light dark:text-error-text-dark mt-1">{modelsError}</p>}
      </div>
    </>
  );
};

export default GoogleConfig;
