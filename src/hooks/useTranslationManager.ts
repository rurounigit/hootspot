import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!rebuttal || !apiKey || serviceProvider === 'local') return;
    if (language === rebuttal.lang) return;
    if (translatedRebuttals[language]) return;
    setIsTranslatingRebuttal(true);
    setError(null);
    translateText(apiKey, rebuttal.text, language, selectedModel, t)
      .then(translated => setTranslatedRebuttals(prev => ({ ...prev, [language]: translated })))
      .catch(err => setError(err.message))
      .finally(() => setIsTranslatingRebuttal(false));
  }, [language, rebuttal, translatedRebuttals, apiKey, selectedModel, t, serviceProvider]);

  const handleRebuttalUpdate = (newRebuttal: string) => {
    const canonicalRebuttal = { text: newRebuttal, lang: language };
    setRebuttal(canonicalRebuttal);
    setTranslatedRebuttals({ [language]: newRebuttal });
  };

  const displayedRebuttal = translatedRebuttals[language] || null;

  return {
    rebuttal,
    setRebuttal,
    isTranslatingRebuttal,
    handleRebuttalUpdate,
    displayedRebuttal,
    translationError: error,
  };
};
