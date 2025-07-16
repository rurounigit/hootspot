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
  currentModelDetails: GeminiModel | null;
  areModelsLoading: boolean;
  modelsError: string | null;
  isNightMode: boolean;
  onNightModeChange: (value: boolean) => void;
  includeRebuttalInJson: boolean;
  onIncludeRebuttalInJsonChange: (value: boolean) => void;
  includeRebuttalInPdf: boolean;
  onIncludeRebuttalInPdfChange: (value: boolean) => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
  currentApiKey,
  onApiKeySave,
  currentMaxCharLimit,
  onMaxCharLimitSave,
  models,
  selectedModel,
  onModelChange,
  currentModelDetails,
  areModelsLoading,
  modelsError,
  isNightMode,
  onNightModeChange,
  includeRebuttalInJson,
  onIncludeRebuttalInJsonChange, // This was missing from the destructuring before
  includeRebuttalInPdf,
  onIncludeRebuttalInPdfChange // This was also missing
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
    <div className="bg-panel-bg-light dark:bg-panel-bg-dark shadow-md rounded-lg p-4 mb-4 border border-panel-border-light dark:border-panel-border-dark">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <SettingsIcon className="w-6 h-6 mr-2 text-link-light dark:text-link-dark" />
          <h2 className="text-lg font-semibold text-text-label-light dark:text-text-label-dark">{t('config_title')}</h2>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-link-light hover:text-link-hover-light"
          aria-label={isCollapsed ? t('config_toggle_expand') : t('config_toggle_collapse')}
        >
          {isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg>
          )}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <div className="mb-4 p-4 bg-info-bg-light border border-info-border-light rounded-md dark:bg-info-bg-dark dark:border-info-border-dark">
            <div className="flex items-start">
              <InfoIcon className="w-5 h-5 mr-2 text-link-light dark:text-link-dark flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-info-text-light dark:text-info-text-dark">
                  {t('config_api_key_info')}
                </p>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium inline-flex items-center text-link-light hover:text-link-hover-light dark:text-link-dark dark:hover:text-link-hover-dark"
                >
                  {t('config_get_api_key')} <ExternalLinkIcon className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="apiKey" className="block text-sm font-medium text-text-label-light dark:text-text-label-dark mb-1">
              {t('config_api_key_label')}
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKeyInput}
              onChange={(e) => { setApiKeyInput(e.target.value); setTestStatus(null); }}
              placeholder={t('config_api_key_placeholder')}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-input-bg-light border-input-border-light text-input-text-light dark:bg-input-bg-dark dark:border-input-border-dark dark:text-input-text-dark"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="maxCharLimit" className="block text-sm font-medium text-text-label-light dark:text-text-label-dark mb-1">
              {t('config_max_chars_label')}
            </label>
            <input
              type="number"
              id="maxCharLimit"
              value={maxCharLimitInput}
              onChange={(e) => setMaxCharLimitInput(e.target.value)}
              min="100"
              step="100"
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-input-bg-light border-input-border-light text-input-text-light dark:bg-input-bg-dark dark:border-input-border-dark dark:text-input-text-dark"
            />
            <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mt-1">{t('config_max_chars_info')}</p>
          </div>
          <div className="mb-6">
            <label htmlFor="modelSelector" className="block text-sm font-medium text-text-label-light dark:text-text-label-dark mb-1">
              {t('config_model_label')}
            </label>
            <select
              id="modelSelector"
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              disabled={areModelsLoading || allModelsEmpty}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600 bg-input-bg-light border-input-border-light text-input-text-light dark:bg-input-bg-dark dark:border-input-border-dark dark:text-input-text-dark"
            >
              {areModelsLoading && <option>{t('config_model_loading')}</option>}
              {modelsError && <option>{t('config_model_error')}</option>}
              {!areModelsLoading && !modelsError && (
                <>
                  {models.preview.length > 0 && ( <optgroup label={t('config_model_preview_group')}> {models.preview.map(model => ( <option key={model.name} value={model.name}> {model.displayName} </option> ))} </optgroup> )}
                  {models.stable.length > 0 && ( <optgroup label={t('config_model_stable_group')}> {models.stable.map(model => ( <option key={model.name} value={model.name}> {model.displayName} </option>))} </optgroup> )}
                </>
              )}
            </select>
            {modelsError && <p className="text-xs text-error-text-light dark:text-error-text-dark mt-1">{modelsError}</p>}
          </div>
          <button
            onClick={handleSave}
            disabled={isTesting}
            className="w-full flex items-center justify-center px-4 py-2 bg-button-primary-bg-light text-button-text-light font-semibold rounded-md shadow-sm hover:bg-button-primary-hover-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-button-disabled-bg-light"
          >
            {isTesting ? ( <div className="spinner w-5 h-5 border-t-white mr-2"></div> ) : ( <SaveIcon className="w-5 h-5 mr-2" /> )}
            {isTesting ? t('config_button_saving') : t('config_button_save_test')}
          </button>

          {testStatus && ( <div className={`mt-4 p-3 rounded-md text-sm ${testStatus.type === 'success' ? 'bg-success-bg-light text-success-text-light border border-success-border-light dark:bg-success-bg-dark dark:text-success-text-dark dark:border-success-border-dark' : 'bg-error-bg-light text-error-text-light border border-error-border-light dark:bg-error-bg-dark dark:text-error-text-dark dark:border-error-border-dark'}`}> {testStatus.message} </div> )}

          <div className="mt-4 pt-4 border-t border-divider-light dark:border-divider-dark space-y-3">
            <div className="flex items-center justify-between">
                <label htmlFor="nightModeToggle" className="text-sm font-medium text-text-label-light dark:text-text-label-dark"> {t('config_night_mode')} </label>
                <button onClick={() => onNightModeChange(!isNightMode)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${ isNightMode ? 'bg-toggle-bg-on-dark' : 'bg-toggle-bg-off-light' }`} >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${ isNightMode ? 'translate-x-6' : 'translate-x-1' }`} />
                </button>
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="rebuttalJsonToggle" className="text-sm font-medium text-text-label-light dark:text-text-label-dark"> {t('config_include_rebuttal_json')} </label>
              <button onClick={() => onIncludeRebuttalInJsonChange(!includeRebuttalInJson)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${ includeRebuttalInJson ? 'bg-toggle-bg-on-dark' : 'bg-toggle-bg-off-light' }`} >
                  <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${ includeRebuttalInJson ? 'translate-x-6' : 'translate-x-1' }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="rebuttalPdfToggle" className="text-sm font-medium text-text-label-light dark:text-text-label-dark"> {t('config_include_rebuttal_pdf')} </label>
              <button onClick={() => onIncludeRebuttalInPdfChange(!includeRebuttalInPdf)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${ includeRebuttalInPdf ? 'bg-toggle-bg-on-dark' : 'bg-toggle-bg-off-light' }`} >
                  <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${ includeRebuttalInPdf ? 'translate-x-6' : 'translate-x-1' }`} />
              </button>
            </div>
          </div>

          <LanguageManager apiKey={currentApiKey} />
        </>
      )}
       {isCollapsed && currentApiKey && ( <p className="text-sm text-success-text-light dark:text-success-text-dark">{t('config_api_key_configured')}</p> )}
       {isCollapsed && !currentApiKey && ( <p className="text-sm text-error-text-light dark:text-error-text-dark">{t('config_api_key_not_configured')}</p> )}
    </div>
  );
};

export default ApiKeyManager;