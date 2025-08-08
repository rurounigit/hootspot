// src/components/LanguageManager.tsx

import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { translateUI } from '../api/google/translation';
import { translateUIWithLMStudio } from '../api/lm-studio';
import { AddIcon } from '../assets/icons';
import { defaultLanguages } from '../i18n';
import { translateUIWithOllama } from '../api/ollama';
import { createNumberedJsonForTranslation, reconstructTranslatedJson } from '../utils/translationUtils';

interface LanguageManagerProps {
  serviceProvider: 'cloud' | 'local';
  cloudProvider: 'google' | 'openrouter';
  localProviderType: 'lm-studio' | 'ollama';
  apiKey: string | null;
  lmStudioConfig: { url: string; model: string; };
  ollamaConfig: { url: string; model: string; };
  isCurrentProviderConfigured: boolean;
}

const LanguageManager: React.FC<LanguageManagerProps> = ({
  serviceProvider,
  localProviderType,
  apiKey,
  lmStudioConfig,
  ollamaConfig,
  isCurrentProviderConfigured
}) => {
  const { t, addLanguage, deleteLanguage, availableLanguages } = useTranslation();
  const [newLangCode, setNewLangCode] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddLanguage = async () => {
    setError(null);
    const code = newLangCode.trim().toLowerCase();
    if (!code) {
      setError(t('lang_manager_error_empty'));
      return;
    }
    if (!isCurrentProviderConfigured) {
      setError(t('lang_manager_error_no_key'));
      return;
    }

    setIsTranslating(true);

    try {
      const baseTranslationsModule = await import('../locales/en.json');
      const baseTranslations = baseTranslationsModule.default as Record<string, string>;

      // Use the utility to create the numbered JSON and the map
      const { numberedJson, numberToKeyMap } = createNumberedJsonForTranslation(baseTranslations);

      let translatedNumberedJson: Record<string, string>;
      const jsonToSend = JSON.stringify(numberedJson);

      if (serviceProvider === 'google' && apiKey) {
        translatedNumberedJson = await translateUI(apiKey, code, jsonToSend, t);
      } else if (serviceProvider === 'local') {
        if (localProviderType === 'lm-studio') {
          translatedNumberedJson = await translateUIWithLMStudio(lmStudioConfig.url, lmStudioConfig.model, code, jsonToSend);
        } else { // Ollama
          translatedNumberedJson = await translateUIWithOllama(ollamaConfig.url, ollamaConfig.model, code, jsonToSend);
        }
      } else {
        throw new Error("Translation provider not properly configured.");
      }

      // Use the utility to reconstruct the final JSON
      const reconstructedJson = reconstructTranslatedJson(translatedNumberedJson, numberToKeyMap);

      if (Object.keys(reconstructedJson).length !== Object.keys(baseTranslations).length) {
        throw new Error(t('lang_manager_error_parse', { message: "The translated response was incomplete." }));
      }

      addLanguage(code, code, reconstructedJson);
      setNewLangCode('');

    } catch (err: any) {
      setError(err.message || t('lang_manager_error_generic'));
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDeleteLanguage = (code: string, name: string) => {
    if (window.confirm(t('lang_manager_delete_confirm', { langName: name }))) {
      deleteLanguage(code);
    }
  };

  const customLanguages = Object.entries(availableLanguages).filter(
    ([code]) => !Object.keys(defaultLanguages).includes(code)
  );

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('lang_manager_title')}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {t('lang_manager_info')}
      </p>
      <div className="space-y-4">
        <div>
          <label htmlFor="langCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('lang_manager_code_label')}</label>
          <input
            type="text"
            id="langCode"
            value={newLangCode}
            onChange={(e) => setNewLangCode(e.target.value)}
            placeholder={t('lang_manager_code_placeholder')}
            maxLength={5}
            className="mt-1 w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50"
            disabled={isTranslating}
          />
        </div>
        <button
          onClick={handleAddLanguage}
          disabled={isTranslating || !isCurrentProviderConfigured}
          className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600"
        >
          {isTranslating ? (
            <div className="spinner w-5 h-5 border-t-white mr-2"></div>
          ) : (
            <AddIcon className="w-5 h-5 mr-2" />
          )}
          {isTranslating ? t('lang_manager_button_translating') : t('lang_manager_button_add')}
        </button>

         {error && (
            <div className="mt-4 p-3 rounded-md text-sm bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-500">
              {error}
            </div>
        )}
      </div>

      {customLanguages.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('lang_manager_custom_languages_title')}</h3>
          <ul className="space-y-2">
            {customLanguages.map(([code, name]) => (
              <li key={code} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-50">{name}</span>
                <button
                  onClick={() => handleDeleteLanguage(code, name)}
                  className="px-3 py-1 text-sm font-semibold rounded-md bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-500 dark:hover:bg-red-900/60"
                  aria-label={`Delete ${name}`}
                >
                  {t('lang_manager_delete_button')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LanguageManager;
