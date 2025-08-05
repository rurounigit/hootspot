// src/components/config/LMStudioConfig.tsx

import React from 'react';
import { useTranslation } from '../../i18n';
import { InfoIcon } from '../../assets/icons';
import { GroupedModels } from '../../hooks/useModels';

interface LMStudioConfigProps {
  lmStudioUrl: string;
  onLmStudioUrlChange: (url: string) => void;
  models: GroupedModels;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  areModelsLoading: boolean;
  modelsError: string | null;
  onRefetchModels: () => void;
}

const LMStudioConfig: React.FC<LMStudioConfigProps> = ({
  lmStudioUrl,
  onLmStudioUrlChange,
  models,
  selectedModel,
  onModelChange,
  areModelsLoading,
  modelsError,
  onRefetchModels
}) => {
  const { t } = useTranslation();
  const allModels = models.stable; // Local models are all in the 'stable' group

  return (
    <>
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900 dark:border-blue-700">
        <div className="flex items-start">
          <InfoIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-300">{t('config_local_server_info')}</p>
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="lmStudioUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('config_local_server_url_label')}</label>
        <input
          type="text"
          id="lmStudioUrl"
          value={lmStudioUrl}
          onChange={(e) => onLmStudioUrlChange(e.target.value)}
          placeholder={t('config_local_server_url_placeholder')}
          className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50"
        />
      </div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="modelSelector" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('config_local_model_name_label_dropdown')}
          </label>
          <button onClick={onRefetchModels} disabled={areModelsLoading || !lmStudioUrl} className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed">
            {t('config_model_refresh')}
          </button>
        </div>
        <select
          id="modelSelector"
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={areModelsLoading || !!modelsError || !lmStudioUrl}
          className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600 bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50"
        >
          {areModelsLoading && <option>{t('config_model_loading')}</option>}
          {modelsError && <option>{t('config_model_error')}</option>}
          {!areModelsLoading && !modelsError && allModels.length === 0 && (
            <option>{t('config_local_model_no_models')}</option>
          )}
          {!areModelsLoading && !modelsError && allModels.map(model => (
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

export default LMStudioConfig;