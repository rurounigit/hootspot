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
      <div className="mb-4 p-4 bg-info-bg-light border border-info-border-light rounded-md dark:bg-info-bg-dark dark:border-info-border-dark">
        <div className="flex items-start">
          <InfoIcon className="w-5 h-5 mr-2 text-link-light dark:text-link-dark flex-shrink-0 mt-0.5" />
          <p className="text-sm text-info-text-light dark:text-info-text-dark">{t('config_local_server_info')}</p>
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="lmStudioUrl" className="block text-sm font-medium text-text-label-light dark:text-text-label-dark mb-1">{t('config_local_server_url_label')}</label>
        <input type="text" id="lmStudioUrl" value={lmStudioUrl} onChange={(e) => onLmStudioUrlChange(e.target.value)} placeholder={t('config_local_server_url_placeholder')} className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-input-bg-light border-input-border-light text-input-text-light dark:bg-input-bg-dark dark:border-input-border-dark dark:text-input-text-dark" />
      </div>
      <div className="mb-6">
        <label htmlFor="lmStudioModel" className="block text-sm font-medium text-text-label-light dark:text-text-label-dark mb-1">{t('config_local_model_name_label')}</label>
        <input type="text" id="lmStudioModel" value={lmStudioModel} onChange={(e) => onLmStudioModelChange(e.target.value)} placeholder={t('config_local_model_name_placeholder')} className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-input-bg-light border-input-border-light text-input-text-light dark:bg-input-bg-dark dark:border-input-border-dark dark:text-input-text-dark" />
      </div>
    </>
  );
};

export default LMStudioConfig;
