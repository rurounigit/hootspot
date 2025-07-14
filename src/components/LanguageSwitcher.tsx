// src/components/LanguageSwitcher.tsx

import React from 'react';
import { useTranslation, LanguageCode } from '../i18n';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, availableLanguages, t } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as LanguageCode);
  };

  // MODIFIED: The outer div with absolute positioning has been removed.
  return (
    <select
      value={language}
      onChange={handleLanguageChange}
      className="bg-white border border-gray-300 rounded-md shadow-sm p-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
      aria-label={t('lang_switcher_aria_label')}
    >
      {Object.entries(availableLanguages).map(([code, name]) => (
        <option key={code} value={code}>
          {name}
        </option>
      ))}
    </select>
  );
};

export default LanguageSwitcher;