// src/i18n.tsx
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { CUSTOM_LANGUAGES_KEY, LANGUAGE_KEY } from './config/storage-keys';

export const defaultLanguages = {
  en: 'en',
  de: 'de',
  fr: 'fr',
  es: 'es',
};

export type LanguageCode = string;
export type LanguagePack = Record<LanguageCode, string>;

interface LanguageContextType {
  language: LanguageCode;
  availableLanguages: LanguagePack;
  setLanguage: (language: LanguageCode) => void;
  addLanguage: (code: LanguageCode, name: string, translations: Record<string, string>) => void;
  deleteLanguage: (languageCode: LanguageCode) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // ADDED: A one-time migration effect for language settings.
  useEffect(() => {
    const oldLang = localStorage.getItem('athena-ai-language');
    if (oldLang) {
      localStorage.setItem(LANGUAGE_KEY, oldLang);
      localStorage.removeItem('athena-ai-language');
    }
    const oldCustomLangs = localStorage.getItem('athenaAICustomLanguages');
    if (oldCustomLangs) {
      localStorage.setItem(CUSTOM_LANGUAGES_KEY, oldCustomLangs);
      localStorage.removeItem('athenaAICustomLanguages');
    }
  }, []);

  const [availableLanguages, setAvailableLanguages] = useState<LanguagePack>(defaultLanguages);
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    // UPDATED: Reads from the new storage key.
    const storedLang = localStorage.getItem(LANGUAGE_KEY) as LanguageCode;
    return storedLang || 'en';
  });
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    const customLanguagesStr = localStorage.getItem(CUSTOM_LANGUAGES_KEY);
    if (customLanguagesStr) {
      try {
        const customLanguages = JSON.parse(customLanguagesStr);
        setAvailableLanguages(prev => ({ ...prev, ...customLanguages }));
      } catch (e) {
        console.error("Failed to parse custom languages from localStorage", e);
      }
    }
  }, []);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        if (Object.keys(defaultLanguages).includes(language)) {
          const module = await import(`./locales/${language}.json`);
          setTranslations(module.default);
        } else {
          const customTranslationsStr = localStorage.getItem(`translation_${language}`);
          if (customTranslationsStr) {
            setTranslations(JSON.parse(customTranslationsStr));
          } else {
            throw new Error(`No translations found for custom language: ${language}`);
          }
        }
      } catch (error) {
        console.error(`Could not load translations for ${language}:`, error);
        try {
          const fallbackModule = await import('./locales/en.json');
          setTranslations(fallbackModule.default);
          setLanguageState('en');
        } catch (fallbackError) {
          console.error('Could not load fallback English translations:', fallbackError);
        }
      }
    };
    loadTranslations();
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    // UPDATED: Writes to the new storage key.
    localStorage.setItem(LANGUAGE_KEY, lang);
    setLanguageState(lang);
  };

  const addLanguage = (code: LanguageCode, name: string, newTranslations: Record<string, string>) => {
    const updatedLanguages = { ...availableLanguages, [code]: name };
    setAvailableLanguages(updatedLanguages);

    const customLanguages = { ...updatedLanguages };
    Object.keys(defaultLanguages).forEach(key => delete customLanguages[key as keyof typeof customLanguages]);
    localStorage.setItem(CUSTOM_LANGUAGES_KEY, JSON.stringify(customLanguages));

    localStorage.setItem(`translation_${code}`, JSON.stringify(newTranslations));
    setLanguage(code);
  };

  const deleteLanguage = (codeToDelete: LanguageCode) => {
    if (Object.keys(defaultLanguages).includes(codeToDelete)) {
      console.error("Cannot delete a default language.");
      return;
    }

    if (language === codeToDelete) {
      setLanguage('en');
    }

    const updatedLanguages = { ...availableLanguages };
    delete updatedLanguages[codeToDelete];
    setAvailableLanguages(updatedLanguages);

    const customLanguagesStr = localStorage.getItem(CUSTOM_LANGUAGES_KEY);
    if (customLanguagesStr) {
      const customLanguages = JSON.parse(customLanguagesStr);
      delete customLanguages[codeToDelete];
      localStorage.setItem(CUSTOM_LANGUAGES_KEY, JSON.stringify(customLanguages));
    }
    localStorage.removeItem(`translation_${codeToDelete}`);
  };

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    let translation = translations[key] || key;
    if (replacements) {
      Object.keys(replacements).forEach(placeholder => {
        translation = translation.replace(`{${placeholder}}`, String(replacements[placeholder]));
      });
    }
    return translation;
  }, [translations]);

  const value = { language, availableLanguages, setLanguage, addLanguage, deleteLanguage, t };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};