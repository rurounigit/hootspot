// src/components/config/LMStudioConfig.tsx

import React from 'react';
import { useTranslation } from '../../i18n';
import { InfoIcon } from '../../assets/icons';

interface LMStudioConfigProps {
  lmStudioUrl: string;
  onLmStudioUrlChange: (url: string) => void;
  lmStudioModel: string;
  onLmStudioModelChange: (model: string) => void;
}

const LMStudioConfig: React.FC<LMStudioConfigProps> = ({
  lmStudioUrl,
  onLmStudioUrlChange,
  lmStudioModel,
  onLmStudioModelChange,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900 dark:border-blue-700">
        <div className="flex items-start">
          <InfoIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-300">{t('config_local_server_info')}</p>
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="lmStudioUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('config_local_server_url_label')}</label>
        <input type="text" id="lmStudioUrl" value={lmStudioUrl} onChange={(e) => onLmStudioUrlChange(e.target.value)} placeholder={t('config_local_server_url_placeholder')} className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50" />
      </div>
      <div className="mb-6">
        <label htmlFor="lmStudioModel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('config_local_model_name_label')}</label>
        <input type="text" id="lmStudioModel" value={lmStudioModel} onChange={(e) => onLmStudioModelChange(e.target.value)} placeholder={t('config_local_model_name_placeholder')} className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50" />
      </div>
    </>
  );
};

export default LMStudioConfig;
