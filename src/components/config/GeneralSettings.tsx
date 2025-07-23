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
      <div className="mb-4 border-t border-gray-200 dark:border-gray-600 pt-4">
        <label htmlFor="maxCharLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('config_max_chars_label')}</label>
        <input type="number" id="maxCharLimit" value={maxCharLimitInput} onChange={handleMaxCharLimitChange} min="100" step="100" className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50" />
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('config_max_chars_info')}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-3">
        {/* --- FIX APPLIED BELOW --- */}
        <div className="flex items-center justify-between">
          <label id="nightModeLabel" className="text-sm font-medium text-gray-700 dark:text-gray-300"> {t('config_night_mode')} </label>
          <button
            onClick={() => onNightModeChange(!isNightMode)}
            aria-labelledby="nightModeLabel" // Links the label to the button for accessibility
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${ isNightMode ? 'bg-blue-600' : 'bg-gray-300' }`}
          >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${ isNightMode ? 'translate-x-6' : 'translate-x-1' }`} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <label id="rebuttalJsonLabel" className="text-sm font-medium text-gray-700 dark:text-gray-300"> {t('config_include_rebuttal_json')} </label>
          <button
            onClick={() => onIncludeRebuttalInJsonChange(!includeRebuttalInJson)}
            aria-labelledby="rebuttalJsonLabel" // Links the label to the button
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${ includeRebuttalInJson ? 'bg-blue-600' : 'bg-gray-300' }`}
          >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${ includeRebuttalInJson ? 'translate-x-6' : 'translate-x-1' }`} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <label id="rebuttalPdfLabel" className="text-sm font-medium text-gray-700 dark:text-gray-300"> {t('config_include_rebuttal_pdf')} </label>
          <button
            onClick={() => onIncludeRebuttalInPdfChange(!includeRebuttalInPdf)}
            aria-labelledby="rebuttalPdfLabel" // Links the label to the button
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${ includeRebuttalInPdf ? 'bg-blue-600' : 'bg-gray-300' }`}
          >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${ includeRebuttalInPdf ? 'translate-x-6' : 'translate-x-1' }`} />
          </button>
        </div>
      </div>
    </>
  );
};

export default GeneralSettings;