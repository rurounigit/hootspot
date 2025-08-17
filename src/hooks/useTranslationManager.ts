// src/hooks/useTranslationManager.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../i18n';
import { translateText as translateWithGoogle } from '../api/google/translation';
import { translateText as translateWithOpenRouter } from '../api/openrouter/translation';
import { translateTextWithLMStudio } from '../api/lm-studio';
import { translateTextWithOllama } from '../api/ollama';
import { ConfigError } from '../utils/errors';

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
  // FIX 1: Allow the state to hold `null` to signify a failed translation attempt.
  const [translatedRebuttals, setTranslatedRebuttals] = useState<Record<string, string | null>>({});
  const [isTranslatingRebuttal, setIsTranslatingRebuttal] = useState(false);
  const [translationError, setTranslationError] = useState<{ message: string, type: 'config' | 'general' } | null>(null);

  const inflightRequests = useRef<Record<string, boolean>>({});

  const {
    isCurrentProviderConfigured,
    serviceProvider,
    cloudProvider,
    apiKey,
    googleModel,
    openRouterApiKey,
    openRouterModel,
    localProviderType,
    lmStudioConfig,
    ollamaConfig
  } = config;
  const { url: lmStudioUrl, model: lmStudioModel } = lmStudioConfig;
  const { url: ollamaUrl, model: ollamaModel } = ollamaConfig;

  const translateRebuttal = useCallback(async (textToTranslate: string, targetLang: string) => {
    if (!isCurrentProviderConfigured) return;

    inflightRequests.current[targetLang] = true;
    setTranslationError(null);
    setIsTranslatingRebuttal(true);

    try {
      let translatedText: string;
      if (serviceProvider === 'cloud') {
        if (cloudProvider === 'google') {
          if (!apiKey) throw new Error(t('error_api_key_not_configured'));
          translatedText = await translateWithGoogle(apiKey, textToTranslate, targetLang, googleModel, t);
        } else { // openrouter
          if (!openRouterApiKey) throw new Error(t('error_api_key_not_configured'));
          translatedText = await translateWithOpenRouter(openRouterApiKey, textToTranslate, targetLang, openRouterModel, t);
        }
      } else { // Local provider
        if (localProviderType === 'lm-studio') {
          translatedText = await translateTextWithLMStudio(textToTranslate, lmStudioUrl, lmStudioModel, targetLang);
        } else { // Ollama
          translatedText = await translateTextWithOllama(textToTranslate, ollamaUrl, ollamaModel, targetLang);
        }
      }
      setTranslatedRebuttals(prev => ({ ...prev, [targetLang]: translatedText }));
    } catch (err: any) {
      const message = t(err.message, err.details) || err.message;
      if (err instanceof ConfigError) {
        setTranslationError({ message, type: 'config' });
      } else {
        setTranslationError({ message, type: 'general' });
      }
      // FIX 2: On error, set the entry to null. This prevents the useEffect from retrying.
      setTranslatedRebuttals(prev => ({ ...prev, [targetLang]: null }));
    } finally {
      setIsTranslatingRebuttal(false);
      inflightRequests.current[targetLang] = false;
    }
  }, [
    isCurrentProviderConfigured, serviceProvider, cloudProvider, apiKey, googleModel,
    openRouterApiKey, openRouterModel, localProviderType, lmStudioUrl, lmStudioModel,
    ollamaUrl, ollamaModel, t
  ]);


  useEffect(() => {
    if (!rebuttal) return;
    if (language === rebuttal.lang) return;
    // This condition now correctly handles success (string) and failure (null), stopping the loop.
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
    // Check for null before trying to display
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