import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { getOpenRouterModels } from '../../api/open-router';
import { InfoIcon, ExternalLinkIcon } from '../../assets/icons';

interface OpenRouterConfigProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

const OpenRouterConfig: React.FC<OpenRouterConfigProps> = ({
  apiKey,
  onApiKeyChange,
  selectedModel,
  onModelChange,
}) => {
  const { t } = useTranslation();
  const [models, setModels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (apiKey) {
      setIsLoading(true);
      getOpenRouterModels(apiKey)
        .then(setModels)
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [apiKey]);

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900 dark:border-blue-700">
        <div className="flex items-start">
          <InfoIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-300">{t('config_openrouter_api_key_info')}</p>
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-sm font-medium inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              {t('config_get_api_key')} <ExternalLinkIcon className="w-4 h-4 ml-1" />
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
        <select id="modelSelector" value={selectedModel} onChange={(e) => onModelChange(e.target.value)} disabled={isLoading || !models.length} className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600 bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50">
          {isLoading && <option>{t('config_model_loading')}</option>}
          {error && <option>{t('config_model_error')}</option>}
          {!isLoading && !error && filteredModels.length === 0 && <option>No models found</option>}
          {!isLoading && !error &&
            filteredModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
        </select>
        {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>}
      </div>
    </>
  );
};

export default OpenRouterConfig;