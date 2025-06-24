import React from 'react';
import { useTranslation, LanguageCode } from '../i18n';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, availableLanguages, t } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as LanguageCode);
  };

  return (
    <div className="absolute top-2 right-4 z-10">
      <select
        value={language}
        onChange={handleLanguageChange}
        className="bg-white border border-gray-300 rounded-md shadow-sm p-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={t('lang_switcher_aria_label')}
      >
        {Object.entries(availableLanguages).map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;