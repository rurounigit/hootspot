// src/components/ApiKeyManager.tsx

import React, { useState, useEffect } from 'react';
import { SaveIcon, SettingsIcon, ExternalLinkIcon, InfoIcon } from '../constants';
import { testApiKey } from '../services/geminiService';
import { useTranslation } from '../i18n';
import LanguageManager from './LanguageManager';
import { GeminiModel } from '../types';
import { GroupedModels } from '../hooks/useModels';

interface ApiKeyManagerProps {
  currentApiKey: string | null;
  onApiKeySave: (key: string) => Promise<{success: boolean, error?: string}>;
  currentMaxCharLimit: number;
  onMaxCharLimitSave: (limit: number) => void;
  models: GroupedModels;
  selectedModel: string;
  onModelChange: (model: string) => void;
  // Props for 'thinking' are removed
  currentModelDetails: GeminiModel | null;
  areModelsLoading: boolean;
  modelsError: string | null;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
  currentApiKey,
  onApiKeySave,
  currentMaxCharLimit,
  onMaxCharLimitSave,
  models,
  selectedModel,
  onModelChange,
  // Destructured props for 'thinking' are removed
  currentModelDetails,
  areModelsLoading,
  modelsError,
}) => {
  const { t } = useTranslation();
  const [apiKeyInput, setApiKeyInput] = useState(currentApiKey || '');
  const [maxCharLimitInput, setMaxCharLimitInput] = useState(currentMaxCharLimit.toString());
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{message: string, type: 'success' | 'error' } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(() => !!localStorage.getItem('athenaAIApiKey'));

  useEffect(() => {
    setApiKeyInput(currentApiKey || '');
  }, [currentApiKey]);

  useEffect(() => {
    setMaxCharLimitInput(currentMaxCharLimit.toString());
  }, [currentMaxCharLimit]);

  const handleSave = async () => {
    setIsTesting(true);
    setTestStatus(null);
    const trimmedApiKey = apiKeyInput.trim();

    try {
      await testApiKey(trimmedApiKey, t, selectedModel);
      const { success, error: saveError } = await onApiKeySave(trimmedApiKey);
      if (!success) {
        throw new Error(saveError || t('error_save_api_key'));
      }

      const newLimit = parseInt(maxCharLimitInput, 10);
      if (!isNaN(newLimit) && newLimit > 0) {
        onMaxCharLimitSave(newLimit);
      } else {
        setMaxCharLimitInput(currentMaxCharLimit.toString());
        setTestStatus({ message: `${t('success_api_key_saved')} ${t('error_invalid_char_limit')}`, type: 'success' });
        setIsTesting(false);
        return;
      }

      setTestStatus({ message: t('success_api_key_saved'), type: 'success' });
      setIsCollapsed(true);

    } catch (err: any) {
      setTestStatus({ message: err.message, type: 'error' });
    } finally {
      setIsTesting(false);
    }
  };

  const allModelsEmpty = models.preview.length === 0 && models.stable.length === 0;

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <SettingsIcon className="w-6 h-6 mr-2 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-700">{t('config_title')}</h2>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-blue-500 hover:text-blue-700"
          aria-label={isCollapsed ? t('config_toggle_expand') : t('config_toggle_collapse')}
        >
          {isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          )}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start">
              <InfoIcon className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-700">
                  {t('config_api_key_info')}
                </p>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                >
                  {t('config_get_api_key')} <ExternalLinkIcon className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
              {t('config_api_key_label')}
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKeyInput}
              onChange={(e) => { setApiKeyInput(e.target.value); setTestStatus(null); }}
              placeholder={t('config_api_key_placeholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="maxCharLimit" className="block text-sm font-medium text-gray-700 mb-1">
              {t('config_max_chars_label')}
            </label>
            <input
              type="number"
              id="maxCharLimit"
              value={maxCharLimitInput}
              onChange={(e) => setMaxCharLimitInput(e.target.value)}
              min="100"
              step="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">{t('config_max_chars_info')}</p>
          </div>
          <div className="mb-6">
            <label htmlFor="modelSelector" className="block text-sm font-medium text-gray-700 mb-1">
              {t('config_model_label')}
            </label>
            {/* The flex container div is removed, leaving only the select element */}
            <select
              id="modelSelector"
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              disabled={areModelsLoading || allModelsEmpty}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              {areModelsLoading && <option>{t('config_model_loading')}</option>}
              {modelsError && <option>{t('config_model_error')}</option>}
              {!areModelsLoading && !modelsError && (
                <>
                  {models.preview.length > 0 && (
                    <optgroup label={t('config_model_preview_group')}>
                      {models.preview.map(model => (
                        <option key={model.name} value={model.name}>
                          {model.displayName}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {models.stable.length > 0 && (
                     <optgroup label={t('config_model_stable_group')}>
                      {models.stable.map(model => (
                        <option key={model.name} value={model.name}>
                          {model.displayName}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </>
              )}
            </select>
            {/* The 'Thinking' checkbox and its container div are removed */}
            {modelsError && <p className="text-xs text-red-500 mt-1">{modelsError}</p>}
          </div>
          <button
            onClick={handleSave}
            disabled={isTesting}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {isTesting ? (
              <div className="spinner w-5 h-5 border-t-white mr-2"></div>
            ) : (
              <SaveIcon className="w-5 h-5 mr-2" />
            )}
            {isTesting ? t('config_button_saving') : t('config_button_save_test')}
          </button>

          {testStatus && (
            <div className={`mt-4 p-3 rounded-md text-sm ${testStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {testStatus.message}
            </div>
          )}

          <LanguageManager apiKey={currentApiKey} />
        </>
      )}
       {isCollapsed && currentApiKey && (
         <p className="text-sm text-green-600">{t('config_api_key_configured')}</p>
       )}
       {isCollapsed && !currentApiKey && (
         <p className="text-sm text-red-600">{t('config_api_key_not_configured')}</p>
       )}
    </div>
  );
};

export default ApiKeyManager;