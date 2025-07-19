// src/components/config/GeneralSettings.tsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';

interface GeneralSettingsProps {
  currentMaxCharLimit: number;
  onMaxCharLimitSave: (limit: number) => void;
  isNightMode: boolean;
  onNightModeChange: (value: boolean) => void;
  includeRebuttalInJson: boolean;
  onIncludeRebuttalInJsonChange: (value: boolean) => void;
  includeRebuttalInPdf: boolean;
  onIncludeRebuttalInPdfChange: (value: boolean) => void;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  currentMaxCharLimit,
  onMaxCharLimitSave,
  isNightMode,
  onNightModeChange,
  includeRebuttalInJson,
  onIncludeRebuttalInJsonChange,
  includeRebuttalInPdf,
  onIncludeRebuttalInPdfChange,
}) => {
  const { t } = useTranslation();
  const [maxCharLimitInput, setMaxCharLimitInput] = useState(currentMaxCharLimit.toString());

  useEffect(() => {
    setMaxCharLimitInput(currentMaxCharLimit.toString());
  }, [currentMaxCharLimit]);

  const handleMaxCharLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxCharLimitInput(e.target.value);
    const newLimit = parseInt(e.target.value, 10);
    if (!isNaN(newLimit) && newLimit > 0) {
      onMaxCharLimitSave(newLimit);
    }
  };

  return (
    <>
      <div className="mb-4 border-t border-divider-light dark:border-divider-dark pt-4">
        <label htmlFor="maxCharLimit" className="block text-sm font-medium text-text-label-light dark:text-text-label-dark mb-1">{t('config_max_chars_label')}</label>
        <input type="number" id="maxCharLimit" value={maxCharLimitInput} onChange={handleMaxCharLimitChange} min="100" step="100" className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-input-bg-light border-input-border-light text-input-text-light dark:bg-input-bg-dark dark:border-input-border-dark dark:text-input-text-dark" />
        <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mt-1">{t('config_max_chars_info')}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-divider-light dark:border-divider-dark space-y-3">
        <div className="flex items-center justify-between"><label htmlFor="nightModeToggle" className="text-sm font-medium text-text-label-light dark:text-text-label-dark"> {t('config_night_mode')} </label><button onClick={() => onNightModeChange(!isNightMode)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${ isNightMode ? 'bg-toggle-bg-on-dark' : 'bg-toggle-bg-off-light' }`} ><span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${ isNightMode ? 'translate-x-6' : 'translate-x-1' }`} /></button></div>
        <div className="flex items-center justify-between"><label htmlFor="rebuttalJsonToggle" className="text-sm font-medium text-text-label-light dark:text-text-label-dark"> {t('config_include_rebuttal_json')} </label><button onClick={() => onIncludeRebuttalInJsonChange(!includeRebuttalInJson)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${ includeRebuttalInJson ? 'bg-toggle-bg-on-dark' : 'bg-toggle-bg-off-light' }`} ><span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${ includeRebuttalInJson ? 'translate-x-6' : 'translate-x-1' }`} /></button></div>
        <div className="flex items-center justify-between"><label htmlFor="rebuttalPdfToggle" className="text-sm font-medium text-text-label-light dark:text-text-label-dark"> {t('config_include_rebuttal_pdf')} </label><button onClick={() => onIncludeRebuttalInPdfChange(!includeRebuttalInPdf)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${ includeRebuttalInPdf ? 'bg-toggle-bg-on-dark' : 'bg-toggle-bg-off-light' }`} ><span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${ includeRebuttalInPdf ? 'translate-x-6' : 'translate-x-1' }`} /></button></div>
      </div>
    </>
  );
};

export default GeneralSettings;
