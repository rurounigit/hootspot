// src/hooks/useTranslationManager.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../i18n';
import { translateText as translateWithGoogle } from '../api/google/translation';
import { translateText as translateWithOpenRouter } from '../api/openrouter/translation';
import { translateTextWithLMStudio } from '../api/lm-studio';
import { translateTextWithOllama } from '../api/ollama';

const CONFIG_ERROR_KEYS = [
  'error_api_key_not_configured', 'error_api_key_empty', 'error_api_key_test_failed_message', 'error_quota_exhausted', 'error_api_generic', 'error_api_key_test_failed_generic',
  'error_local_server_config_missing', 'error_local_server_connection', 'error_local_model_not_loaded', 'error_local_model_not_loaded_exact', 'error_local_model_mismatch',
  'error_provider_not_configured',
  'test_query_returned_empty',
];

const isConfigError = (errorMessage: string): boolean => {
  if (!errorMessage || !errorMessage.startsWith('KEY::')) return false;
  const key = errorMessage.split('::')[1];
  return CONFIG_ERROR_KEYS.some(configKey => key === configKey);
};

const getCleanErrorMessage = (errorMessage: string): string => {
    if (errorMessage && errorMessage.startsWith('KEY::')) {
        return errorMessage.substring(errorMessage.indexOf('::', 5) + 2);
    }
    return errorMessage;
};

// Define a comprehensive config interface for the hook
interface UseTranslationManagerConfig {
  serviceProvider: 'cloud' | 'local';
  cloudProvider: 'google' | 'openrouter';
  localProviderType: 'lm-studio' | 'ollama';
  apiKey: string | null;
  openRouterApiKey: string | null;
  googleModel: string;
  openRouterModel: string;
  lmStudioConfig: { url: string; model: string; };
  ollamaConfig: { url: string; model: string; };
  isCurrentProviderConfigured: boolean;
}

export const useTranslationManager = (config: UseTranslationManagerConfig) => {
  const { t, language } = useTranslation();
  const [rebuttal, setRebuttal] = useState<{ text: string; lang: string; } | null>(null);
  const [translatedRebuttals, setTranslatedRebuttals] = useState<Record<string, string>>({});
  const [isTranslatingRebuttal, setIsTranslatingRebuttal] = useState(false);
  const [translationError, setTranslationError] = useState<{ message: string, type: 'config' | 'general' } | null>(null);

  const inflightRequests = useRef<Record<string, boolean>>({});

  const translateRebuttal = useCallback(async (textToTranslate: string, targetLang: string) => {
    if (!config.isCurrentProviderConfigured) return;

    inflightRequests.current[targetLang] = true;
    setTranslationError(null);
    setIsTranslatingRebuttal(true);

    try {
      let translatedText: string;
      if (config.serviceProvider === 'cloud') {
        if (config.cloudProvider === 'google') {
          if (!config.apiKey) throw new Error(t('error_api_key_not_configured'));
          translatedText = await translateWithGoogle(config.apiKey, textToTranslate, targetLang, config.googleModel, t);
        } else { // openrouter
          if (!config.openRouterApiKey) throw new Error(t('error_api_key_not_configured'));
          translatedText = await translateWithOpenRouter(config.openRouterApiKey, textToTranslate, targetLang, config.openRouterModel, t);
        }
      } else { // Local provider
        if (config.localProviderType === 'lm-studio') {
          translatedText = await translateTextWithLMStudio(textToTranslate, config.lmStudioConfig.url, config.lmStudioConfig.model, targetLang);
        } else { // Ollama
          translatedText = await translateTextWithOllama(textToTranslate, config.ollamaConfig.url, config.ollamaConfig.model, targetLang);
        }
      }
      setTranslatedRebuttals(prev => ({ ...prev, [targetLang]: translatedText }));
    } catch (err: any) {
      const rawMessage = (err as Error).message;
      const cleanMessage = getCleanErrorMessage(rawMessage);
      if (isConfigError(rawMessage)) {
        setTranslationError({ message: cleanMessage, type: 'config' });
      } else {
        setTranslationError({ message: cleanMessage, type: 'general' });
      }
    } finally {
      setIsTranslatingRebuttal(false);
      inflightRequests.current[targetLang] = false;
    }
  }, [config, t]);


  useEffect(() => {
    if (!rebuttal) return;
    if (language === rebuttal.lang) return;
    if (translatedRebuttals[language] !== undefined) return;
    if (inflightRequests.current[language]) return;

    translateRebuttal(rebuttal.text, language);
  }, [language, rebuttal, translatedRebuttals, translateRebuttal]);


  const handleRebuttalUpdate = (newRebuttal: string) => {
    const canonicalRebuttal = { text: newRebuttal, lang: language };
    setRebuttal(canonicalRebuttal);
    setTranslatedRebuttals({ [language]: newRebuttal });
    inflightRequests.current = {};
  };

  const loadRebuttal = (loaded: { text: string; lang: string }) => {
    setRebuttal(loaded);
    setTranslatedRebuttals({});
    inflightRequests.current = {};
  };

  const clearTranslationError = useCallback(() => {
      setTranslationError(null);
  }, []);

  const displayedRebuttal =
    translatedRebuttals[language] ??
    (rebuttal && rebuttal.lang === language ? rebuttal.text : null);

  return {
    rebuttal,
    displayedRebuttal,
    isTranslatingRebuttal,
    handleRebuttalUpdate,
    loadRebuttal,
    translationError: translationError,
    clearTranslationError,
  };
};


// ---
// NEW: A hook specifically for managing UI language translations.
// ---
import { useConfig } from './useConfig';
import { translateUI as translateUIGoogle } from '../api/google/translation';
import { translateUI as translateUIOpenRouter } from '../api/openrouter/translation';
import { translateUIWithLMStudio } from '../api/lm-studio';
import { translateUIWithOllama } from '../api/ollama';
import { LanguageCode } from '../i18n';

export const useLanguageManager = () => {
    const { t, setLanguage, language, addLanguage } = useTranslation();
    const {
        serviceProvider,
        cloudProvider,
        localProviderType,
        apiKeyInput: apiKey, // Renaming apiKeyInput to apiKey for local use
        openRouterApiKey,
        googleModel,
        openRouterModel,
        lmStudioUrl,
        lmStudioModel,
        ollamaUrl,
        ollamaModel,
        isCurrentProviderConfigured
    } = useConfig();
    const [isTranslating, setIsTranslating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [targetLang, setTargetLang] = useState<LanguageCode | null>(null);

    const handleTranslateLanguage = async (lang: LanguageCode) => {
        if (!isCurrentProviderConfigured) {
            setError(t('lang_manager_error_config_needed'));
            return;
        }
        setTargetLang(lang);
        setShowConfirmation(true);
    };

    const confirmTranslation = async () => {
        if (!targetLang) return;
        setShowConfirmation(false);
        setIsTranslating(true);
        setError(null);

        try {
            const baseLangPath = `/locales/en.json`;
            const response = await fetch(baseLangPath);
            const baseTranslations = await response.text();

            let translatedStrings: Record<string, string>;

            if (serviceProvider === 'cloud') {
                if (cloudProvider === 'google') {
                    if (!apiKey) throw new Error(t('error_api_key_not_configured'));
                    translatedStrings = await translateUIGoogle(apiKey, targetLang, baseTranslations, googleModel, t);
                } else { // openrouter
                    if (!openRouterApiKey) throw new Error(t('error_api_key_not_configured'));
                    translatedStrings = await translateUIOpenRouter(openRouterApiKey, targetLang, baseTranslations, openRouterModel, t);
                }
            } else {
                if (localProviderType === 'lm-studio') {
                    translatedStrings = await translateUIWithLMStudio(lmStudioUrl, lmStudioModel, targetLang, baseTranslations);
                } else { // Ollama
                    translatedStrings = await translateUIWithOllama(ollamaUrl, ollamaModel, targetLang, baseTranslations);
                }
            }

            addLanguage(targetLang, `Custom (${targetLang})`, translatedStrings); // Assuming a name for the custom language
            setLanguage(targetLang);

        } catch (err: any) {
            const rawMessage = (err as Error).message;
            const cleanMessage = getCleanErrorMessage(rawMessage);
            setError(cleanMessage);
        } finally {
            setIsTranslating(false);
            setTargetLang(null);
        }
    };

    const cancelTranslation = () => {
        setShowConfirmation(false);
        setTargetLang(null);
    };

    return {
        isTranslating,
        error,
        showConfirmation,
        handleTranslateLanguage,
        confirmTranslation,
        cancelTranslation,
        targetLang,
        currentLanguage: language,
    };
};
