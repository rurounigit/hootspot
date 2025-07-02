// src/components/ApiKeyManager.tsx

import React, { useState, useEffect } from 'react';
import { SaveIcon, SettingsIcon, ExternalLinkIcon, InfoIcon } from '../constants';
import { testApiKey } from '../services/geminiService';
import { useTranslation } from '../i18n';
import LanguageManager from './LanguageManager';
import { GeminiModel } from '../types';

interface ApiKeyManagerProps {
  currentApiKey: string | null;
  onApiKeySave: (key: string) => Promise<{success: boolean, error?: string}>;
  currentMaxCharLimit: number;
  onMaxCharLimitSave: (limit: number) => void;
  models: GeminiModel[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  isThinkingEnabled: boolean;
  onThinkingChange: (enabled: boolean) => void;
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
  isThinkingEnabled,
  onThinkingChange,
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

  const safeModels = models || [];

  // MODIFIED: This function now uses a try/catch block for clearer logic.
  const handleSave = async () => {
    setIsTesting(true);
    setTestStatus(null);
    const trimmedApiKey = apiKeyInput.trim();

    try {
      // 1. Test the API key against the currently selected model.
      // This will throw an error if it fails, which the catch block will handle.
      await testApiKey(trimmedApiKey, t, selectedModel);

      // 2. If the test passes, proceed with saving everything.
      const { success, error: saveError } = await onApiKeySave(trimmedApiKey);
      if (!success) {
        // This handles potential localStorage saving errors.
        throw new Error(saveError || t('error_save_api_key'));
      }

      const newLimit = parseInt(maxCharLimitInput, 10);
      if (!isNaN(newLimit) && newLimit > 0) {
        onMaxCharLimitSave(newLimit);
      } else {
        setMaxCharLimitInput(currentMaxCharLimit.toString());
        // Show a success message but also inform about the invalid limit.
        setTestStatus({ message: `${t('success_api_key_saved')} ${t('error_invalid_char_limit')}`, type: 'success' });
        setIsTesting(false);
        return; // Early return after setting status
      }

      // 3. If everything was successful, show the success message.
      setTestStatus({ message: t('success_api_key_saved'), type: 'success' });
      setIsCollapsed(true);

    } catch (err: any) {
      // 4. If testApiKey (or any other step in try) fails, display the error.
      setTestStatus({ message: err.message, type: 'error' });
    } finally {
      // 5. Always stop the loading spinner.
      setIsTesting(false);
    }
  };

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
            <div className="flex items-center space-x-2">
              <select
                id="modelSelector"
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                disabled={areModelsLoading || safeModels.length === 0}
                className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                {areModelsLoading && <option>Loading models...</option>}
                {modelsError && <option>Error loading models</option>}
                {!areModelsLoading && !modelsError && safeModels.map(model => (
                  <option key={model.name} value={model.name}>
                    {model.displayName}
                  </option>
                ))}
              </select>
              <div className="flex items-center pl-2" title={!currentModelDetails?.thinking ? "This model does not support the 'thinking' feature." : "Enable 'thinking' feature"}>
                  <input
                    type="checkbox"
                    id="thinkingToggle"
                    checked={isThinkingEnabled}
                    onChange={(e) => onThinkingChange(e.target.checked)}
                    disabled={!currentModelDetails?.thinking}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <label htmlFor="thinkingToggle" className={`ml-2 text-sm font-medium ${!currentModelDetails?.thinking ? 'text-gray-400' : 'text-gray-700'}`}>
                    Thinking
                  </label>
              </div>
            </div>
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