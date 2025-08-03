// src/hooks/useTranslationManager.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../i18n';
import { translateText as translateWithGoogle } from '../api/google/translation';
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
  serviceProvider: 'google' | 'local';
  localProviderType: 'lm-studio' | 'ollama';
  apiKey: string | null;
  googleModel: string;
  lmStudioConfig: { url: string; model: string; };
  ollamaConfig: { url: string; model: string; };
  isCurrentProviderConfigured: boolean;
}

export const useTranslationManager = (config: UseTranslationManagerConfig) => {
  const { t, language } = useTranslation();
  const [rebuttal, setRebuttal] = useState<{ text: string; lang: string; } | null>(null);
  const [translatedRebuttals, setTranslatedRebuttals] = useState<Record<string, string>>({});
  const [isTranslatingRebuttal, setIsTranslatingRebuttal] = useState(false); // string is language code
  const [translationError, setTranslationError] = useState<{ message: string, type: 'config' | 'general' } | null>(null);

  const inflightRequests = useRef<Record<string, boolean>>({});

  const translateRebuttal = useCallback(async (textToTranslate: string, targetLang: string) => {
    if (!config.isCurrentProviderConfigured) return;

    inflightRequests.current[targetLang] = true;
    setTranslationError(null);
    setIsTranslatingRebuttal(true);

    try {
      let translatedText: string;
      if (config.serviceProvider === 'google') {
        if (!config.apiKey) throw new Error(t('error_api_key_not_configured'));
        translatedText = await translateWithGoogle(config.apiKey, textToTranslate, targetLang, config.googleModel, t);
      } else { // Local provider
        if (config.localProviderType === 'lm-studio') {
          translatedText = await translateTextWithLMStudio(textToTranslate, config.lmStudioConfig.url, config.lmStudioConfig.model, targetLang, t);
        } else { // Ollama
          translatedText = await translateTextWithOllama(textToTranslate, config.ollamaConfig.url, config.ollamaConfig.model, targetLang, t);
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
    // When a new rebuttal is generated, it becomes the canonical version in the current language.
    const canonicalRebuttal = { text: newRebuttal, lang: language };
    setRebuttal(canonicalRebuttal);
    // The cache is reset with only the new, just-generated text.
    setTranslatedRebuttals({ [language]: newRebuttal });
    // All old in-flight requests are now obsolete.
    inflightRequests.current = {};
  };

  const loadRebuttal = (loaded: { text: string; lang: string }) => {
    setRebuttal(loaded);
    setTranslatedRebuttals({}); // Reset translations to force re-translation if needed
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
