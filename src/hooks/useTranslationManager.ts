import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { translateText } from '../api/google/translation';

export const useTranslationManager = (
  apiKey: string | null,
  selectedModel: string,
  serviceProvider: 'google' | 'local'
) => {
  const { t, language } = useTranslation();
  const [rebuttal, setRebuttal] = useState<{ text: string; lang: string; } | null>(null);
  const [translatedRebuttals, setTranslatedRebuttals] = useState<Record<string, string>>({});
  const [isTranslatingRebuttal, setIsTranslatingRebuttal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This ref tracks requests currently in progress to prevent duplicates.
  const inflightRequests = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!rebuttal || !apiKey || serviceProvider === 'local') return;
    if (language === rebuttal.lang) return;
    if (translatedRebuttals[language] !== undefined) return;

    // **THE FIX:** Prevent duplicate API calls by checking if a request is already in-flight.
    if (inflightRequests.current[language]) return;

    setIsTranslatingRebuttal(true);
    setError(null);

    // Mark that we have started a request for this language.
    inflightRequests.current[language] = true;

    translateText(apiKey, rebuttal.text, language, selectedModel, t)
      .then(translated => {
        setTranslatedRebuttals(prev => ({ ...prev, [language]: translated }));
      })
      .catch(err => setError(err.message))
      .finally(() => {
        setIsTranslatingRebuttal(false);
        // Mark the request as no longer in-flight.
        inflightRequests.current[language] = false;
      });
  // The dependency array is correct and includes the cache state.
  }, [language, rebuttal, apiKey, selectedModel, t, serviceProvider, translatedRebuttals]);

  const handleRebuttalUpdate = (newRebuttal: string) => {
    const canonicalRebuttal = { text: newRebuttal, lang: language };
    setRebuttal(canonicalRebuttal);
    // Reset the cache with only the new text.
    setTranslatedRebuttals({ [language]: newRebuttal });
    // Also reset the in-flight tracker, as all old requests are now invalid.
    inflightRequests.current = {};
  };

  const displayedRebuttal = translatedRebuttals[language] || null;

  return {
    rebuttal,
    displayedRebuttal,
    isTranslatingRebuttal,
    handleRebuttalUpdate,
    translationError: error,
  };
};