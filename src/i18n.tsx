import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { CUSTOM_LANGUAGES_KEY } from './constants';

// Define default languages
export const defaultLanguages = { // Add 'export'
  en: 'en',
  de: 'de',
  fr: 'fr',
  es: 'es',
};

export type LanguageCode = string;
export type LanguagePack = Record<LanguageCode, string>;

// Define the shape of the context
interface LanguageContextType {
  language: LanguageCode;
  availableLanguages: LanguagePack;
  setLanguage: (language: LanguageCode) => void;
  addLanguage: (code: LanguageCode, name: string, translations: Record<string, string>) => void;
  deleteLanguage: (languageCode: LanguageCode) => void; // Add this line
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Define the provider component
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [availableLanguages, setAvailableLanguages] = useState<LanguagePack>(defaultLanguages);
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const storedLang = localStorage.getItem('athena-ai-language') as LanguageCode;
    return storedLang || 'en';
  });
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load custom languages from localStorage on initial load
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
        // Check if it's a default language
        if (Object.keys(defaultLanguages).includes(language)) {
          const module = await import(`./locales/${language}.json`);
          setTranslations(module.default);
        } else { // It's a custom language from localStorage
          const customTranslationsStr = localStorage.getItem(`translation_${language}`);
          if (customTranslationsStr) {
            setTranslations(JSON.parse(customTranslationsStr));
          } else {
            throw new Error(`No translations found for custom language: ${language}`);
          }
        }
      } catch (error) {
        console.error(`Could not load translations for ${language}:`, error);
        // Fallback to English if the selected language file fails
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
    localStorage.setItem('athena-ai-language', lang);
    setLanguageState(lang);
  };

  const addLanguage = (code: LanguageCode, name: string, newTranslations: Record<string, string>) => {
    // Update available languages state
    const updatedLanguages = { ...availableLanguages, [code]: name };
    setAvailableLanguages(updatedLanguages);

    // Save the new list of custom languages to localStorage
    const customLanguages = { ...updatedLanguages };
    Object.keys(defaultLanguages).forEach(key => delete customLanguages[key as keyof typeof customLanguages]);
    localStorage.setItem(CUSTOM_LANGUAGES_KEY, JSON.stringify(customLanguages));

    // Save the new translation file to localStorage
    localStorage.setItem(`translation_${code}`, JSON.stringify(newTranslations));

    // Optionally, switch to the new language
    setLanguage(code);
  };

  const deleteLanguage = (codeToDelete: LanguageCode) => {
    // Prevent deleting default languages
    if (Object.keys(defaultLanguages).includes(codeToDelete)) {
      console.error("Cannot delete a default language.");
      return;
    }

    // If deleting the currently active language, switch to English first
    if (language === codeToDelete) {
      setLanguage('en');
    }

    // Update available languages state
    const updatedLanguages = { ...availableLanguages };
    delete updatedLanguages[codeToDelete];
    setAvailableLanguages(updatedLanguages);

    // Remove from localStorage
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

// Custom hook to use the translation context
export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};