// src/hooks/useTranslationManager.ts
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { translateText } from '../api/google/translation';
import { generateRebuttalWithLMStudio } from '../api/lm-studio';
import { generateRebuttalWithOllama } from '../api/ollama';
import { GeminiAnalysisResponse } from '../types/api';


// The hook signature can be simplified. We don't need to pass all the configs down.
// The RebuttalGenerator component will have access to them.
export const useTranslationManager = (
  apiKey: string | null,
  serviceProvider: 'google' | 'local'
) => {
  const { t, language } = useTranslation();
  const [rebuttal, setRebuttal] = useState<{ text: string; lang: string; } | null>(null);
  const [translatedRebuttals, setTranslatedRebuttals] = useState<Record<string, string>>({});
  const [isTranslatingRebuttal, setIsTranslatingRebuttal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inflightRequests = useRef<Record<string, boolean>>({});

  useEffect(() => {
    // We only auto-translate rebuttals generated via the Google API
    if (!rebuttal || !apiKey || serviceProvider !== 'google') return;
    if (language === rebuttal.lang) return;
    if (translatedRebuttals[language] !== undefined) return;
    if (inflightRequests.current[language]) return;

    setIsTranslatingRebuttal(true);
    setError(null);
    inflightRequests.current[language] = true;

    // The selected model for translation should ideally be a fast one.
    // We can hardcode the default model here or pass it down. For now, let's assume a default.
    translateText(apiKey, rebuttal.text, language, 'models/gemini-2.5-flash-lite-preview-06-17', t)
      .then(translated => {
        setTranslatedRebuttals(prev => ({ ...prev, [language]: translated }));
      })
      .catch(err => setError(err.message))
      .finally(() => {
        setIsTranslatingRebuttal(false);
        inflightRequests.current[language] = false;
      });
  }, [language, rebuttal, apiKey, t, serviceProvider, translatedRebuttals]);

  const handleRebuttalUpdate = (newRebuttal: string) => {
    const canonicalRebuttal = { text: newRebuttal, lang: language };
    setRebuttal(canonicalRebuttal);
    setTranslatedRebuttals({ [language]: newRebuttal });
    inflightRequests.current = {};
  };

  const generateRebuttal = async (
      analysis: GeminiAnalysisResponse,
      sourceText: string,
      localProviderType: 'lm-studio' | 'ollama',
      lmStudioConfig: { url: string; model: string; },
      ollamaConfig: { url: string; model: string; },
      googleConfig: { model: string; }
  ): Promise<string> => {
      setError(null);
      if (serviceProvider === 'google') {
          if (!apiKey) throw new Error(t('error_api_key_not_configured'));
          // Import `generateRebuttal` from google/analysis at the top
          const { generateRebuttal: genGoogle } = await import('../api/google/analysis');
          return genGoogle(apiKey, sourceText, analysis, googleConfig.model, language);
      }
      // Local provider
      if (localProviderType === 'lm-studio') {
          return generateRebuttalWithLMStudio(sourceText, analysis, lmStudioConfig.url, lmStudioConfig.model, language, t);
      }
      // Ollama
      return generateRebuttalWithOllama(sourceText, analysis, ollamaConfig.url, ollamaConfig.model, language, t);
  };


  const displayedRebuttal = translatedRebuttals[language] || null;

  return {
    rebuttal,
    displayedRebuttal,
    isTranslatingRebuttal,
    handleRebuttalUpdate,
    generateRebuttal, // Expose the generator function
    translationError: error,
  };
};